import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { EditRecipe, ExportResult } from "./types";
import { getPresetById } from "./presets";
import { simd } from "wasm-feature-detect";

const CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
const DEFAULT_LOAD_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 250;
const DEFAULT_RETRY_BACKOFF = 2;
const DEFAULT_LOAD_TIMEOUT_MS = 30000;

let ffmpegInstance: FFmpeg | null = null;

export type FFmpegLoadErrorCode =
  | "NETWORK_LOAD_FAILED"
  | "WASM_INSTANTIATION_FAILED"
  | "FFMPEG_TIMEOUT"
  | "CDN_UNREACHABLE";

export interface FFmpegLoadErrorContext {
  attempt: number;
  maxAttempts: number;
  coreName: string;
  retryable: boolean;
  originalError?: string;
}

export interface LoadFFmpegOptions {
  signal?: AbortSignal;
  retries?: number;
  retryDelayMs?: number;
  retryBackoffFactor?: number;
  timeoutMs?: number;
}

/**
 * Error thrown when the FFmpeg WebAssembly core fails to load.
 * This typically happens when the user is offline, the CDN is unreachable (or if the url is wrong),
 * or there are network interruptions during the initialization phase.
 */
export class FFmpegLoadError extends Error {
  code: FFmpegLoadErrorCode;

  userMessage: string;

  context?: FFmpegLoadErrorContext;

  constructor(code: FFmpegLoadErrorCode, userMessage: string, context?: FFmpegLoadErrorContext) {
    super(userMessage);
    this.name = "FFmpegLoadError";
    this.code = code;
    this.userMessage = userMessage;
    this.context = context;
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      globalThis.clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> {
  if (timeoutMs <= 0 || !Number.isFinite(timeoutMs)) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      reject(new FFmpegLoadError("FFMPEG_TIMEOUT", "Failed to load the video engine in time."));
    }, timeoutMs);

    const onAbort = () => {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });

    promise.then(
      (value) => {
        globalThis.clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      }
    );
  });
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  return typeof err === "string" ? err : "Unknown error";
}

function classifyLoadFailure(err: unknown): { code: FFmpegLoadErrorCode; userMessage: string; retryable: boolean } {
  const text = describeError(err).toLowerCase();

  if (text.includes("timeout")) {
    return {
      code: "FFMPEG_TIMEOUT",
      userMessage: "Loading the video engine took too long. Please try again on a more stable connection.",
      retryable: true,
    };
  }

  if (text.includes("network") || text.includes("failed to fetch") || text.includes("fetch")) {
    return {
      code: "NETWORK_LOAD_FAILED",
      userMessage: "Failed to load video processing components. Please check your internet connection and try again.",
      retryable: true,
    };
  }

  if (text.includes("cdn") || text.includes("bloburl") || text.includes("404") || text.includes("503")) {
    return {
      code: "CDN_UNREACHABLE",
      userMessage: "The video engine could not be downloaded right now. Please try again in a moment.",
      retryable: true,
    };
  }

  return {
    code: "WASM_INSTANTIATION_FAILED",
    userMessage: "Your browser could not initialize the video engine. Please try a recent version of Chrome, Edge, or Firefox.",
    retryable: false,
  };
}

async function loadFFmpegAttempt(
  ffmpeg: FFmpeg,
  signal: AbortSignal | undefined,
  coreName: string,
  timeoutMs: number
): Promise<void> {
  const loadPromise = ffmpeg.load(
    {
      coreURL: await toBlobURL(`${CORE_BASE_URL}/${coreName}.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE_URL}/${coreName}.wasm`, "application/wasm"),
    },
    { signal }
  );

  await withTimeout(loadPromise, timeoutMs, signal);
}

export async function loadFFmpeg(signalOrOptions?: AbortSignal | LoadFFmpegOptions): Promise<FFmpeg> {
  const options: LoadFFmpegOptions =
    signalOrOptions instanceof AbortSignal || !signalOrOptions
      ? { signal: signalOrOptions ?? undefined }
      : signalOrOptions;
  const signal = options.signal;
  const retries = options.retries ?? DEFAULT_LOAD_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const retryBackoffFactor = options.retryBackoffFactor ?? DEFAULT_RETRY_BACKOFF;
  const timeoutMs = options.timeoutMs ?? DEFAULT_LOAD_TIMEOUT_MS;

  if (ffmpegInstance?.loaded) return ffmpegInstance;

  const ffmpeg = ffmpegInstance ?? new FFmpeg();
  ffmpegInstance = ffmpeg;

  let coreName = "ffmpeg-core";

  try {
    // Check if the user's browser supports WebAssembly SIMD
    const isSimdSupported = await simd();

    // Dynamically set the core filename
    coreName = isSimdSupported ? "ffmpeg-core-simd" : "ffmpeg-core";

    const maxAttempts = Math.max(1, retries);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await loadFFmpegAttempt(ffmpeg, signal, coreName, timeoutMs);
        return ffmpeg;
      } catch (err) {
        if (err instanceof FFmpegLoadError) {
          throw err;
        }

        if (err instanceof DOMException && err.name === "AbortError") {
          throw err;
        }

        const failure = classifyLoadFailure(err);
        const context: FFmpegLoadErrorContext = {
          attempt,
          maxAttempts,
          coreName,
          retryable: failure.retryable,
          originalError: describeError(err),
        };

        if (attempt < maxAttempts && failure.retryable) {
          console.warn("[FFmpeg] load attempt failed; retrying", {
            attempt,
            maxAttempts,
            code: failure.code,
            originalError: context.originalError,
          });
          await sleep(retryDelayMs * (retryBackoffFactor ** (attempt - 1)), signal);
          continue;
        }

        throw new FFmpegLoadError(failure.code, failure.userMessage, context);
      }
    }

    const failure = classifyLoadFailure(new Error("Unknown FFmpeg load failure"));
    throw new FFmpegLoadError(failure.code, failure.userMessage, {
      attempt: maxAttempts,
      maxAttempts,
      coreName,
      retryable: failure.retryable,
      originalError: "Unknown FFmpeg load failure",
    });
  } catch (err) {
    if (ffmpegInstance === ffmpeg) {
      ffmpegInstance = null;
    }
    throw err;
  }
}

/** Terminates the active FFmpeg instance and releases its memory. */
export function terminateFFmpeg() {
  ffmpegInstance?.terminate();
  ffmpegInstance = null;
}

/** Generates a unique session ID used to isolate FFmpeg file names across concurrent exports. */
function buildSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Builds the FFmpeg -vf filter chain string from the current recipe settings. */
function buildVideoFilter(recipe: EditRecipe, targetW: number, targetH: number): string {
  const filters: string[] = [];

  if (recipe.trimStart > 0 || recipe.trimEnd !== null) {
    const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
    filters.push(`trim=start=${recipe.trimStart}:end=${end}`);
    filters.push("setpts=PTS-STARTPTS");
  }

  if (recipe.rotate === 90) {
    filters.push("transpose=1");
  } else if (recipe.rotate === 180) {
    filters.push("transpose=1,transpose=1");
  } else if (recipe.rotate === 270) {
    filters.push("transpose=2");
  }

  if (recipe.stabilization) {
    filters.push("deshake=x=-1:y=-1:w=-1:h=-1:rx=16:ry=16");
  }

  if (recipe.framing === "fit") {
    filters.push(
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease`,
      `pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black`
    );
  } else {
    filters.push(
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase`,
      `crop=${targetW}:${targetH}`
    );
  }

  if (recipe.speed !== 1) {
    const pts = (1 / recipe.speed).toFixed(4);
    filters.push(`setpts=${pts}*PTS`);
  }
  filters.push(
    `eq=brightness=${recipe.brightness}:contrast=${recipe.contrast}:saturation=${recipe.saturation}`
  );
  return filters.join(",");
}

/** Builds an atempo filter chain for the given playback speed, chaining multiple filters for speeds outside the 0.5–2.0 range. */
export function buildAudioFilter(speed: number): string {
  if (speed === 1) return "";

  const filters: string[] = [];
  let remaining = speed;

  // Chain filters for slow speeds
  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }

  // Chain filters for fast speeds
  while (remaining > 2.0) {
    filters.push("atempo=2.0");
    remaining /= 2.0;
  }

  // Add final remaining filter if not exactly 1.0
  // using a small epsilon check to avoid floating point issues
  if (Math.abs(remaining - 1.0) > 0.001) {
    filters.push(`atempo=${Number(remaining.toFixed(4))}`);
  }

  return filters.join(",");
}

function buildAudioTrimFilter(recipe: EditRecipe): string {
  if (recipe.trimStart === 0 && recipe.trimEnd === null) return "";
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

export async function exportVideo(
  ffmpeg: FFmpeg,
  file: File,
  recipe: EditRecipe,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<ExportResult> {
  const sessionId = buildSessionId();
  let targetW: number, targetH: number;
  if (recipe.preset === "custom") {
    targetW = recipe.customWidth;
    targetH = recipe.customHeight;
  } else {
    const preset = getPresetById(recipe.preset);
    targetW = preset?.width ?? 1920;
    targetH = preset?.height ?? 1080;
  }

  // dimensions must be even for libx264
  targetW = Math.round(targetW / 2) * 2;
  targetH = Math.round(targetH / 2) * 2;

  const ext = file.name.split(".").pop() ?? "mp4";
  const inputName = `input_${sessionId}.${ext}`;

  // Determine output filename and MIME type based on format
  const getOutputConfig = (format: string) => {
    switch (format) {
      case "webm":
        return { filename: `output_${sessionId}.webm`, mimeType: "video/webm" };
      case "mkv":
        return { filename: `output_${sessionId}.mkv`, mimeType: "video/x-matroska" };
      default: // mp4
        return { filename: `output_${sessionId}.mp4`, mimeType: "video/mp4" };
    }
  };

  const { filename: outputName, mimeType } = getOutputConfig(recipe.format);
  const fallbackOutputName = `fallback_${sessionId}.webm`;
  const cleanupFiles = new Set<string>([inputName, outputName, fallbackOutputName]);

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  };

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file), { signal });

    ffmpeg.on("progress", handleProgress);

    const vf = buildVideoFilter(recipe, targetW, targetH);
    const audioTrim = buildAudioTrimFilter(recipe);
    const audioSpeed = buildAudioFilter(recipe.speed);
    const afParts = [audioTrim, audioSpeed].filter(Boolean);
    const af = afParts.join(",");

    const args = ["-i", inputName];
    if (vf) args.push("-vf", vf);

    if (!recipe.keepAudio) {
      args.push("-an");
    } else if (af) {
      args.push("-af", af);
    }

    // Add codec-specific arguments based on selected format
    if (recipe.format === "webm") {
      args.push(
        "-c:v", "libvpx-vp9",
        "-crf", String(recipe.quality)
      );
      if (recipe.keepAudio) {
        args.push("-c:a", "libopus");
      }
    } else if (recipe.format === "mkv") {
      args.push(
        "-c:v", "libx264",
        "-crf", String(recipe.quality),
        "-preset", "medium"
      );
      if (recipe.keepAudio) {
        args.push("-c:a", "aac", "-b:a", "128k");
      }
    } else {
      // MP4 (default)
      args.push(
        "-c:v", "libx264",
        "-crf", String(recipe.quality),
        "-preset", "medium",
        "-movflags", "+faststart"
      );
      if (recipe.keepAudio) {
        args.push("-c:a", "aac", "-b:a", "128k");
      }
    }

    args.push(outputName);

    const exitCode = await ffmpeg.exec(args, undefined, { signal });

    // If the requested format fails, try WebM as fallback
    if (exitCode !== 0) {
      const fallbackArgs = [
        "-i", inputName,
        ...(vf ? ["-vf", vf] : []),
        ...(recipe.keepAudio ? (af ? ["-af", af] : []) : ["-an"]),
        "-c:v", "libvpx-vp9",
        "-crf", String(recipe.quality),
        ...(recipe.keepAudio ? ["-c:a", "libopus"] : []),
        fallbackOutputName,
      ];

      const fallbackCode = await ffmpeg.exec(fallbackArgs, undefined, { signal });

      if (fallbackCode !== 0) {
        throw new Error("Export failed");
      }

      const data = await ffmpeg.readFile(fallbackOutputName, undefined, { signal });
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/webm" });

      onProgress(100);
      return {
        blobUrl: URL.createObjectURL(blob),
        size: blob.size,
        width: targetW,
        height: targetH,
        format: "webm",
      };
    }

    const data = await ffmpeg.readFile(outputName, undefined, { signal });
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: mimeType });

    onProgress(100);
    return {
      blobUrl: URL.createObjectURL(blob),
      size: blob.size,
      width: targetW,
      height: targetH,
      format: recipe.format as "mp4" | "webm" | "mkv",
    };
  } finally {
    ffmpeg.off("progress", handleProgress);
    for (const path of cleanupFiles) {
      try {
        await ffmpeg.deleteFile(path);
      } catch {
      }
    }
  }
}

/** Formats a byte count as a human-readable string (KB or MB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}