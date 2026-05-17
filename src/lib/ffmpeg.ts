import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { EditRecipe, ExportResult } from "./types";
import { getPresetById } from "./presets";
import { simd } from "wasm-feature-detect";

const CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

let ffmpegInstance: FFmpeg | null = null;

/**
 * Error thrown when the FFmpeg WebAssembly core fails to load.
 * This typically happens when the user is offline, the CDN is unreachable (or if the url is wrong),
 * or there are network interruptions during the initialization phase.
 */
export class FFmpegLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FFmpegLoadError";
  }
}

export async function loadFFmpeg(signal?: AbortSignal): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  const ffmpeg = ffmpegInstance ?? new FFmpeg();
  ffmpegInstance = ffmpeg;

  try {
    // Check if the user's browser supports WebAssembly SIMD
    const isSimdSupported = await simd();

    // Dynamically set the core filename
    const coreName = isSimdSupported ? "ffmpeg-core-simd" : "ffmpeg-core";

    // Load FFmpeg using the dynamic URLs + the new signal parameter
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE_URL}/${coreName}.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE_URL}/${coreName}.wasm`, "application/wasm"),
    }, { signal });

    return ffmpeg;
  } catch (err) {
    if (ffmpegInstance === ffmpeg) {
      ffmpegInstance = null;
    }
    throw new FFmpegLoadError("Failed to load the FFmpeg engine. Check your internet connection.");
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