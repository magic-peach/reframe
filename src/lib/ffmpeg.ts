import { EditRecipe, ExportResult, BackgroundMusicOptions, ImageOverlayOptions } from "./types";

export class FFmpegLoadError extends Error {}


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
  if (typeof window === "undefined") {
    throw new Error("Web Workers are not available in this environment.");
  }

  // MUST be strictly inline for Next.js/Webpack to detect and compile the worker chunk
  ffmpegWorker = new Worker(new URL("./ffmpeg.worker.ts", import.meta.url), { type: "module" });
  
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

export async function loadFFmpeg(
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<void> {
  // 1. Capture if the worker is uninitialized before ensureWorker runs
  const isFirstLoad = !ffmpegWorker; 
  
  await ensureWorker();

  if (workerReady && workerReadyResolve === null) {
    onProgress?.(100);
    return;
  }

  // 2. Use the captured flag to securely trigger the worker's internal load phase
  if (isFirstLoad) {
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

  try {
    await workerReady;
  } finally {
    cleanup();
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

export { buildVideoFilter, buildAudioFilter } from "./video-filters";

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
