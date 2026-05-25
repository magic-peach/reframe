import { EditRecipe, ExportResult, BackgroundMusicOptions, ImageOverlayOptions } from "./types";
import { getPresetById } from "./presets";
import { buildTextFilter } from "./text-overlay";

<<<<<<< HEAD
const CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
const DEFAULT_LOAD_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 250;
const DEFAULT_RETRY_BACKOFF = 2;
const DEFAULT_LOAD_TIMEOUT_MS = 30000;
=======
export class FFmpegLoadError extends Error {}
>>>>>>> upstream/main

const FFMPEG_WORKER_URL =
  typeof window !== "undefined"
    ? new URL("./ffmpeg.worker.ts", import.meta.url)
    : null;

<<<<<<< HEAD
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
=======
type SerializedFile = {
  name: string;
  type: string;
  data: ArrayBuffer;
};

type WorkerExportRequest = {
  type: "export";
  id: string;
  file: SerializedFile;
  recipe: EditRecipe;
  videoDuration: number;
  musicFile?: SerializedFile;
  musicOptions?: BackgroundMusicOptions;
  overlayFile?: SerializedFile;
  overlayOptions?: ImageOverlayOptions;
};

type WorkerLoadResponse = { type: "ready" };
type WorkerProgressResponse = { type: "progress"; percent: number };
type WorkerResultResponse = {
  type: "result";
  id: string;
  data: ArrayBuffer;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  format: "mp4" | "webm" | "mkv" | "gif";
};
type WorkerErrorResponse = { type: "error"; id?: string; message: string };
type WorkerCancelledResponse = { type: "cancelled"; id?: string };

type WorkerResponse =
  | WorkerLoadResponse
  | WorkerProgressResponse
  | WorkerResultResponse
  | WorkerErrorResponse
  | WorkerCancelledResponse;

let ffmpegWorker: Worker | null = null;
let workerReady: Promise<void> | null = null;
let workerReadyResolve: (() => void) | null = null;
let workerReadyReject: ((reason?: any) => void) | null = null;
let pendingExport: {
  id: string;
  resolve: (result: ExportResult) => void;
  reject: (reason: unknown) => void;
} | null = null;
let pendingProgress: ((percent: number) => void) | null = null;

function createWorker(): Worker {
  if (!FFMPEG_WORKER_URL) {
    throw new Error("Web Workers are not available in this environment.");
  }

  ffmpegWorker = new Worker(FFMPEG_WORKER_URL, { type: "module" });
  ffmpegWorker.onmessage = handleWorkerMessage;
  ffmpegWorker.onerror = (event) => {
    const message = event.message || "FFmpeg worker error";
    const error = new FFmpegLoadError(message);
    workerReadyReject?.(error);
    pendingExport?.reject(error);
    resetWorker();
  };

  workerReady = new Promise((resolve, reject) => {
    workerReadyResolve = resolve;
    workerReadyReject = reject;
  });

  return ffmpegWorker;
}

function resetWorker() {
  ffmpegWorker = null;
  workerReady = null;
  workerReadyResolve = null;
  workerReadyReject = null;
  pendingExport = null;
  pendingProgress = null;
}

function handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
  const data = event.data;

  if (data.type === "ready") {
    workerReadyResolve?.();
    workerReadyResolve = null;
    workerReadyReject = null;
    pendingProgress?.(100);
    return;
  }

  if (data.type === "progress") {
    pendingProgress?.(data.percent);
    return;
  }

  if (data.type === "result") {
    if (pendingExport?.id !== data.id) return;
    const blob = new Blob([data.data], { type: data.mimeType });
    pendingExport.resolve({
      blobUrl: URL.createObjectURL(blob),
      blob,
      size: data.size,
      width: data.width,
      height: data.height,
      format: data.format,
    });
    pendingExport = null;
    pendingProgress = null;
    return;
  }

  if (data.type === "error") {
    if (data.id && pendingExport?.id === data.id) {
      pendingExport.reject(new Error(data.message));
      pendingExport = null;
      pendingProgress = null;
      return;
    }

    workerReadyReject?.(new FFmpegLoadError(data.message));
    workerReady = null;
    workerReadyResolve = null;
    workerReadyReject = null;
    resetWorker();
    return;
  }

  if (data.type === "cancelled") {
    if (data.id && pendingExport?.id === data.id) {
      pendingExport.reject(new DOMException("Export cancelled", "AbortError"));
      pendingExport = null;
      pendingProgress = null;
    }
    return;
  }
}

async function ensureWorker() {
  if (!ffmpegWorker) {
    createWorker();
  }
}
>>>>>>> upstream/main

export async function loadFFmpeg(
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<void> {
  await ensureWorker();

  if (workerReady && workerReadyResolve === null) {
    onProgress?.(100);
    return;
  }

  if (!workerReady) {
    ffmpegWorker!.postMessage({ type: "load" });
  }

  pendingProgress = onProgress ?? null;

  if (signal?.aborted) {
    ffmpegWorker?.postMessage({ type: "cancel" });
    throw new DOMException("Aborted", "AbortError");
  }

  const cleanup = () => {
    signal?.removeEventListener("abort", onAbort);
  };

  const onAbort = () => {
    ffmpegWorker?.postMessage({ type: "cancel" });
    workerReadyReject?.(new DOMException("Aborted", "AbortError"));
    cleanup();
  };

  signal?.addEventListener("abort", onAbort, { once: true });

  let coreName = "ffmpeg-core";

  try {
<<<<<<< HEAD
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
=======
    await workerReady;
  } finally {
    cleanup();
>>>>>>> upstream/main
  }
}

function cancelPendingExport(reason?: unknown) {
  if (pendingExport) {
    pendingExport.reject(reason ?? new DOMException("Export cancelled", "AbortError"));
    pendingExport = null;
  }
  pendingProgress = null;
}

export async function exportVideo(
  file: File,
  recipe: EditRecipe,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
  musicOptions?: BackgroundMusicOptions,
  overlayOptions?: ImageOverlayOptions
): Promise<ExportResult> {
  await loadFFmpeg(signal, onProgress);

  if (!ffmpegWorker) {
    throw new Error("FFmpeg worker is not available.");
  }

  const sessionId = buildSessionId();
  const arrayBuffer = await file.arrayBuffer();
  const filePayload: SerializedFile = {
    name: file.name,
    type: file.type || "video/mp4",
    data: arrayBuffer,
  };

  const musicFilePayload = musicOptions?.file
    ? {
        name: musicOptions.file.name,
        type: musicOptions.file.type || "audio/mpeg",
        data: await musicOptions.file.arrayBuffer(),
      }
    : undefined;

  const overlayFilePayload = overlayOptions?.file
    ? {
        name: overlayOptions.file.name,
        type: overlayOptions.file.type || "image/png",
        data: await overlayOptions.file.arrayBuffer(),
      }
    : undefined;

  const sanitizedMusicOptions = musicOptions
    ? { ...musicOptions, file: null }
    : undefined;
  const sanitizedOverlayOptions = overlayOptions
    ? { ...overlayOptions, file: null }
    : undefined;

  pendingProgress = onProgress;

  const exportPromise = new Promise<ExportResult>((resolve, reject) => {
    pendingExport = { id: sessionId, resolve, reject };
  });

  if (signal?.aborted) {
    ffmpegWorker.postMessage({ type: "cancel" });
    cancelPendingExport(new DOMException("Aborted", "AbortError"));
    throw new DOMException("Aborted", "AbortError");
  }

  const onAbort = () => {
    ffmpegWorker?.postMessage({ type: "cancel" });
    cancelPendingExport(new DOMException("Aborted", "AbortError"));
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  const transfers: Transferable[] = [arrayBuffer];
  if (musicFilePayload) transfers.push(musicFilePayload.data);
  if (overlayFilePayload) transfers.push(overlayFilePayload.data);

  ffmpegWorker.postMessage(
    {
      type: "export",
      id: sessionId,
      file: filePayload,
      recipe,
      videoDuration: await getVideoDuration(file),
      musicFile: musicFilePayload,
      musicOptions: sanitizedMusicOptions,
      overlayFile: overlayFilePayload,
      overlayOptions: sanitizedOverlayOptions,
    } as WorkerExportRequest,
    transfers
  );

  try {
    return await exportPromise;
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

export function terminateFFmpeg() {
  if (ffmpegWorker) {
    ffmpegWorker.postMessage({ type: "terminate" });
    ffmpegWorker.terminate();
  }
  cancelPendingExport(new DOMException("Export cancelled", "AbortError"));
  resetWorker();
}

function buildSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildVideoFilter(recipe: EditRecipe, targetW: number, targetH: number): string {
  const filters: string[] = [];

  if (recipe.trimStart > 0 || recipe.trimEnd !== null) {
    const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
    filters.push(`trim=start=${recipe.trimStart}:end=${end}`);
  }

  if (recipe.stabilization) {
    filters.push("deshake");
  }

  if (recipe.rotate === 90) {
    filters.push("transpose=1");
  } else if (recipe.rotate === 180) {
    filters.push("transpose=1,transpose=1");
  } else if (recipe.rotate === 270) {
    filters.push("transpose=2");
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

  // Normalize timestamps only when needed — trim or speed change both
  // require a clean 0-based timeline to produce correct output duration.
  if (recipe.trimStart > 0 || recipe.trimEnd !== null || recipe.speed !== 1) {
    filters.push("setpts=PTS-STARTPTS");
  }

  if (recipe.speed !== 1) {
    const pts = (1 / recipe.speed).toFixed(4);
    filters.push(`setpts=${pts}*PTS`);
  }

  if (recipe.denoise) {
    filters.push("hqdn3d=1.5:1.5:6:6");
  }

  const needsEq =
    recipe.brightness !== 0 ||
    recipe.contrast !== 1 ||
    recipe.saturation !== 1;

  if (needsEq) {
    filters.push(
      `eq=brightness=${recipe.brightness}:contrast=${recipe.contrast}:saturation=${recipe.saturation}`
    );
  }

  // Add text overlays
  const textOverlays = recipe.textOverlays || [];
  textOverlays.forEach((overlay) => {
    filters.push(buildTextFilter(overlay, targetW, targetH));
  });

  return filters.join(",");
}

export function buildAudioFilter(speed: number, normalizeAudio: boolean): string {
  if (speed <= 0) return "";
  const filters: string[] = [];

  let remaining = speed;
  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }

  while (remaining > 2.0) {
    filters.push("atempo=2.0");
    remaining /= 2.0;
  }

  if (Math.abs(remaining - 1.0) > 0.001) {
    filters.push(`atempo=${Number(remaining.toFixed(4))}`);
  }

  if (normalizeAudio) filters.push("loudnorm=I=-14:TP=-1.5:LRA=11");

  return filters.join(",");
}

function buildAudioTrimFilter(recipe: EditRecipe): string {
  if (recipe.trimStart === 0 && recipe.trimEnd === null) return "";
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

function buildArguments(
  recipe: EditRecipe,
  format: "mp4" | "webm" | "mkv" | "gif",
  outputName: string,
  inputName: string,
  targetW: number,
  targetH: number,
  hasMusicTrack: boolean,
  musicInputName: string,
  musicOptions: BackgroundMusicOptions | undefined,
  hasOverlay: boolean,
  overlayInputName: string,
  overlayOptions: ImageOverlayOptions | undefined,
  hasOriginalAudio: boolean,
  videoDuration: number
): string[] {
  const vf = buildVideoFilter(recipe, targetW, targetH);
  const audioTrim = hasOriginalAudio ? buildAudioTrimFilter(recipe) : "";
  const audioSpeed = hasOriginalAudio ? buildAudioFilter(recipe.speed, recipe.normalizeAudio ?? false) : "";
  const afParts = [audioTrim, audioSpeed].filter(Boolean);
  const af = afParts.join(",");

  const musicIdx = 1;
  const overlayIdx = hasMusicTrack ? 2 : 1;

  const args: string[] = [];
  args.push("-i", inputName);
  if (hasMusicTrack) {
    if (musicOptions!.loopMusic) args.push("-stream_loop", "-1");
    args.push("-i", musicInputName);
  }
  if (hasOverlay) {
    args.push("-i", overlayInputName);
  }

  const needsFilterComplex = hasOverlay || hasMusicTrack;
  const shouldKeepAudio = recipe.keepAudio && (hasOriginalAudio || hasMusicTrack);

  if (needsFilterComplex) {
    const filterParts: string[] = [];
    let videoOut = "[0:v]";

    if (vf) {
      filterParts.push(`[0:v]${vf}[vbase]`);
      videoOut = "[vbase]";
    }

    if (hasOverlay) {
      const scaledW = overlayOptions!.size;
      const alpha = (overlayOptions!.opacity / 100).toFixed(2);
      const posMap: Record<string, string> = {
        "top-left":     "20:20",
        "top-right":    "W-w-20:20",
        "bottom-left":  "20:H-h-20",
        "bottom-right": "W-w-20:H-h-20",
      };
      const pos = posMap[overlayOptions!.position] ?? "W-w-20:H-h-20";
      filterParts.push(`[${overlayIdx}:v]scale=${scaledW}:-2,format=rgba,colorchannelmixer=aa=${alpha}[logo]`);
      filterParts.push(`${videoOut}[logo]overlay=${pos}[vout]`);
      videoOut = "[vout]";
    }

    let audioOut = "";
    if (shouldKeepAudio) {
      if (hasMusicTrack) {
        const musicVol = (musicOptions!.musicVolume / 100).toFixed(2);
        if (hasOriginalAudio) {
          const origVol  = (musicOptions!.originalAudioVolume / 100).toFixed(2);
          const origChain = afParts.length > 0
            ? `[0:a]${afParts.join(",")},volume=${origVol}[orig]`
            : `[0:a]volume=${origVol}[orig]`;
          filterParts.push(origChain);
          filterParts.push(`[${musicIdx}:a]volume=${musicVol}[music]`);
          filterParts.push(`[orig][music]amix=inputs=2:duration=first:dropout_transition=0[aout]`);
          audioOut = "[aout]";
        } else {
          filterParts.push(`[${musicIdx}:a]volume=${musicVol}[aout]`);
          audioOut = "[aout]";
        }
      } else if (hasOriginalAudio && af) {
        filterParts.push(`[0:a]${af}[aout]`);
        audioOut = "[aout]";
      }
    }

    if (filterParts.length > 0) {
      args.push("-filter_complex", filterParts.join(";"));
    }
    args.push("-map", videoOut === "[0:v]" ? "0:v" : videoOut);

    if (!shouldKeepAudio) {
      args.push("-an");
    } else if (audioOut) {
      args.push("-map", audioOut);
    } else if (hasOriginalAudio) {
      args.push("-map", "0:a");
    }
  } else {
    if (vf) args.push("-vf", vf);
    if (!shouldKeepAudio) {
      args.push("-an");
    } else if (af && hasOriginalAudio) {
      args.push("-af", af);
    }
  }

  if (format === "webm") {
    args.push(
      "-c:v", "libvpx-vp9",
      "-b:v", "0",
      "-crf", String(recipe.quality),
      "-cpu-used", "4",
      "-deadline", "realtime"
    );
    if (shouldKeepAudio) args.push("-c:a", "libopus");
  } else if (format === "mkv") {
    args.push("-c:v", "libx264", "-crf", String(recipe.quality), "-preset", "ultrafast");
    if (shouldKeepAudio) args.push("-c:a", "aac", "-b:a", "128k");
  } else {
    args.push("-c:v", "libx264", "-crf", String(recipe.quality), "-preset", "ultrafast", "-movflags", "+faststart");
    if (shouldKeepAudio) args.push("-c:a", "aac", "-b:a", "128k");
  }

  // Add explicit output duration when speed != 1 to prevent slight duration
  // overshoot caused by encoder/filter pipeline frame flush at stream end.
  if (recipe.speed !== 1) {
    const sourceDuration = (recipe.trimEnd ?? videoDuration) - recipe.trimStart;
    const outputDuration = sourceDuration / recipe.speed;
    args.push("-t", outputDuration.toFixed(6));
  }

  args.push(outputName);
  return args;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
