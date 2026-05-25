

Upgrade

Share
Lite
I've resolved the merge conflicts for the FFmpeg service file.
This was a complex resolution because it involved two different architectural approaches:
Worker-based processing (from origin/main): Good for keeping the UI responsive during heavy exports.
Direct instance processing (from main): A more straightforward approach using the FFmpeg instance directly.
I've unified these by:
Combining all necessary imports and types.
Updating loadFFmpeg to support both worker initialization and direct instance loading.
Merging the buildVideoFilter and buildAudioFilter logic to include all new features like stabilization, denoising, normalization, and text overlays.
Updating exportVideo to handle both worker-based and direct-instance execution paths.
You can find the clean, unified file attached.
resolved_ffmpeg_service.ts
Code · 16.44 KB
View all files in this task
Task completed
How was this result?
Suggested follow-ups
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { EditRecipe, ExportResult, BackgroundMusicOptions, ImageOverlayOptions } from "./types";
import { getPresetById } from "./presets";
import { simd } from "wasm-feature-detect";
import { getCompressionModeOption } from 



Cloud computers
New

resolved_ffmpeg_service.ts
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { EditRecipe, ExportResult, BackgroundMusicOptions, ImageOverlayOptions } from "./types";
import { getPresetById } from "./presets";
import { simd } from "wasm-feature-detect";
import { getCompressionModeOption } from "./constants";
import { buildTextFilter } from "./text-overlay";

const CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

let ffmpegInstance: FFmpeg | null = null;
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

const FFMPEG_WORKER_URL =
  typeof window !== "undefined"
    ? new URL("./ffmpeg.worker.ts", import.meta.url)
    : null;

/**
 * Error thrown when the FFmpeg WebAssembly core fails to load.
 */
export class FFmpegLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FFmpegLoadError";
  }
}

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

type WorkerResponse =
  | { type: "ready" }
  | { type: "progress"; percent: number }
  | {
      type: "result";
      id: string;
      data: ArrayBuffer;
      mimeType: string;
      size: number;
      width: number;
      height: number;
      format: "mp4" | "webm" | "mkv" | "gif";
    }
  | { type: "error"; id?: string; message: string }
  | { type: "cancelled"; id?: string };

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

async function ensureWorker() {
  if (!ffmpegWorker) {
    createWorker();
  }
}

export async function loadFFmpeg(
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<void | FFmpeg> {
  // Worker-based path (from origin/main)
  if (FFMPEG_WORKER_URL) {
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
    const onAbort = () => {
      ffmpegWorker?.postMessage({ type: "cancel" });
      workerReadyReject?.(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    try {
      await workerReady;
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
    return;
  }

  // Direct instance path (from main)
  if (ffmpegInstance?.loaded) {
    onProgress?.(100);
    return ffmpegInstance;
  }
  const ffmpeg = ffmpegInstance ?? new FFmpeg();
  ffmpegInstance = ffmpeg;
  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress?.(Math.round(progress * 100));
  };
  try {
    ffmpeg.on("progress", handleProgress);
    const isSimdSupported = await simd();
    const coreName = isSimdSupported ? "ffmpeg-core-simd" : "ffmpeg-core";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE_URL}/${coreName}.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE_URL}/${coreName}.wasm`, "application/wasm"),
    }, { signal });
    onProgress?.(100);
    return ffmpeg;
  } catch (err) {
    if (ffmpegInstance === ffmpeg) ffmpegInstance = null;
    throw new FFmpegLoadError("Failed to load the FFmpeg engine. Check your internet connection.");
  } finally {
    ffmpeg.off("progress", handleProgress);
  }
}

export function terminateFFmpeg() {
  if (ffmpegWorker) {
    ffmpegWorker.postMessage({ type: "terminate" });
    ffmpegWorker.terminate();
  }
  if (ffmpegInstance) {
    ffmpegInstance.terminate();
    ffmpegInstance = null;
  }
  if (pendingExport) {
    pendingExport.reject(new DOMException("Export cancelled", "AbortError"));
    pendingExport = null;
  }
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

  if (recipe.brightness !== 0 || recipe.contrast !== 1 || recipe.saturation !== 1) {
    filters.push(`eq=brightness=${recipe.brightness}:contrast=${recipe.contrast}:saturation=${recipe.saturation}`);
  }

  const textOverlays = recipe.textOverlays || [];
  textOverlays.forEach((overlay) => {
    filters.push(buildTextFilter(overlay, targetW, targetH));
  });

  return filters.join(",");
}

export function buildAudioFilter(speed: number, normalizeAudio: boolean = false): string {
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
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

function getCompressionSettings(recipe: EditRecipe) {
  const profile = getCompressionModeOption(recipe.compressionMode);
  return {
    crf: profile?.quality ?? recipe.quality,
    audioBitrate: profile?.audioBitrate ?? "128k",
    x264Preset: profile?.x264Preset ?? "medium",
    webmDeadline: profile?.webmDeadline ?? "good",
  };
}

export async function exportVideo(
  file: File,
  recipe: EditRecipe,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
  musicOptions?: BackgroundMusicOptions,
  overlayOptions?: ImageOverlayOptions
): Promise<ExportResult> {
  // If we have a worker, use the worker-based export (origin/main)
  if (FFMPEG_WORKER_URL) {
    await loadFFmpeg(signal, onProgress);
    if (!ffmpegWorker) throw new Error("FFmpeg worker is not available.");

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

    const sanitizedMusicOptions = musicOptions ? { ...musicOptions, file: null } : undefined;
    const sanitizedOverlayOptions = overlayOptions ? { ...overlayOptions, file: null } : undefined;

    pendingProgress = onProgress;
    const exportPromise = new Promise<ExportResult>((resolve, reject) => {
      pendingExport = { id: sessionId, resolve, reject };
    });

    const onAbort = () => {
      ffmpegWorker?.postMessage({ type: "cancel" });
      if (pendingExport) {
        pendingExport.reject(new DOMException("Aborted", "AbortError"));
        pendingExport = null;
      }
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const transfers: Transferable[] = [arrayBuffer];
    if (musicFilePayload) transfers.push(musicFilePayload.data);
    if (overlayFilePayload) transfers.push(overlayFilePayload.data);

    ffmpegWorker.postMessage({
      type: "export",
      id: sessionId,
      file: filePayload,
      recipe,
      videoDuration: await getVideoDuration(file),
      musicFile: musicFilePayload,
      musicOptions: sanitizedMusicOptions,
      overlayFile: overlayFilePayload,
      overlayOptions: sanitizedOverlayOptions,
    } as WorkerExportRequest, transfers);

    try {
      return await exportPromise;
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  }

  // Fallback to direct FFmpeg instance (main)
  const ffmpeg = await loadFFmpeg(signal, onProgress) as FFmpeg;
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
  targetW = Math.round(targetW / 2) * 2;
  targetH = Math.round(targetH / 2) * 2;

  const ext = file.name.split(".").pop() ?? "mp4";
  const inputName = `input_${sessionId}.${ext}`;
  const getOutputConfig = (format: string) => {
    switch (format) {
      case "webm": return { filename: `output_${sessionId}.webm`, mimeType: "video/webm" };
      case "mkv": return { filename: `output_${sessionId}.mkv`, mimeType: "video/x-matroska" };
      default: return { filename: `output_${sessionId}.mp4`, mimeType: "video/mp4" };
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
    const audioSpeed = buildAudioFilter(recipe.speed, recipe.normalizeAudio);
    const af = [audioTrim, audioSpeed].filter(Boolean).join(",");
    const compression = getCompressionSettings(recipe);

    const args = ["-i", inputName];
    if (vf) args.push("-vf", vf);
    if (!recipe.keepAudio) {
      args.push("-an");
    } else if (af) {
      args.push("-af", af);
    }

    if (recipe.format === "webm") {
      args.push("-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(compression.crf), "-deadline", compression.webmDeadline);
      if (recipe.keepAudio) args.push("-c:a", "libopus", "-b:a", compression.audioBitrate);
    } else if (recipe.format === "mkv") {
      args.push("-c:v", "libx264", "-crf", String(compression.crf), "-preset", compression.x264Preset);
      if (recipe.keepAudio) args.push("-c:a", "aac", "-b:a", compression.audioBitrate);
    } else {
      args.push("-c:v", "libx264", "-crf", String(compression.crf), "-preset", compression.x264Preset, "-movflags", "+faststart");
      if (recipe.keepAudio) args.push("-c:a", "aac", "-b:a", compression.audioBitrate);
    }
    args.push(outputName);

    const exitCode = await ffmpeg.exec(args, undefined, { signal });
    if (exitCode !== 0) {
      const fallbackArgs = [
        "-i", inputName,
        ...(vf ? ["-vf", vf] : []),
        ...(recipe.keepAudio ? (af ? ["-af", af] : []) : ["-an"]),
        "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(compression.crf), "-deadline", compression.webmDeadline,
        ...(recipe.keepAudio ? ["-c:a", "libopus", "-b:a", compression.audioBitrate] : []),
        fallbackOutputName,
      ];
      const fallbackCode = await ffmpeg.exec(fallbackArgs, undefined, { signal });
      if (fallbackCode !== 0) throw new Error("Export failed");
      const data = await ffmpeg.readFile(fallbackOutputName, undefined, { signal });
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/webm" });
      onProgress(100);
      return { blobUrl: URL.createObjectURL(blob), size: blob.size, width: targetW, height: targetH, format: "webm", sourceName: file.name, compressionMode: recipe.compressionMode };
    }

    const data = await ffmpeg.readFile(outputName, undefined, { signal });
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: mimeType });
    onProgress(100);
    return { blobUrl: URL.createObjectURL(blob), size: blob.size, width: targetW, height: targetH, format: recipe.format as any, sourceName: file.name, compressionMode: recipe.compressionMode };
  } finally {
    ffmpeg.off("progress", handleProgress);
    for (const path of cleanupFiles) {
      try { await ffmpeg.deleteFile(path); } catch {}
    }
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

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
Resolving Code Merge Conflicts in TypeScript Files - Manus