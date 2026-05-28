import type { AutoReframePoint } from "@/lib/types";

type PoseDetectionModule = typeof import("@tensorflow-models/pose-detection");

type AnalyzeOptions = {
  fps?: number;
  maxSamples?: number;
  smoothingAlpha?: number;
  minConfidence?: number;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

type PoseDetector = Awaited<ReturnType<PoseDetectionModule["createDetector"]>>;

let detectorPromise: Promise<PoseDetector> | null = null;

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Subject tracking cancelled", "AbortError");
  }
}

async function loadDetector(signal?: AbortSignal): Promise<PoseDetector> {
  assertNotAborted(signal);

  if (!detectorPromise) {
    detectorPromise = (async () => {
      const [tf, wasm, poseDetection] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow/tfjs-backend-wasm"),
        import("@tensorflow-models/pose-detection"),
      ]);

      wasm.setWasmPaths("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/");
      await tf.setBackend("wasm");
      await tf.ready();
      assertNotAborted(signal);

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: false,
        }
      );
      if (signal?.aborted) {
        detector.dispose();
      }
      assertNotAborted(signal);
      return detector;
    })();
    detectorPromise.catch(() => {
      detectorPromise = null;
    });
  }

  const detector = await detectorPromise;
  assertNotAborted(signal);
  return detector;
}

export async function disposeSubjectDetector(): Promise<void> {
  const promise = detectorPromise;
  const detector = promise ? await promise.catch(() => null) : null;
  detectorPromise = null;
  detector?.dispose();
}

function createVideo(file: File, signal?: AbortSignal): Promise<{ video: HTMLVideoElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new DOMException("Subject tracking cancelled", "AbortError"));
    };

    const onLoaded = () => {
      cleanup();
      resolve({ video, url });
    };

    const onError = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new Error("Could not load video for subject tracking."));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
    video.addEventListener("loadedmetadata", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;
    video.load();
  });
}

function seekVideo(video: HTMLVideoElement, time: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Subject tracking cancelled", "AbortError"));
    };

    const onSeeked = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Could not seek video while tracking subject."));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.05));
  });
}

function waitForNextTask(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Subject tracking cancelled", "AbortError"));
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 0);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function buildSampleTimes(duration: number, fps: number, maxSamples: number): number[] {
  if (!Number.isFinite(duration) || duration <= 0) return [0];
  const interval = 1 / Math.max(1, fps);
  const rawCount = Math.max(1, Math.ceil(duration / interval));
  const step = Math.max(interval, duration / maxSamples);
  const count = Math.min(maxSamples, rawCount);

  return Array.from({ length: count }, (_, index) => {
    if (count === 1) return 0;
    return Math.min(duration - 0.05, index * step);
  });
}

function poseCenterX(
  pose: Awaited<ReturnType<PoseDetector["estimatePoses"]>>[number] | undefined,
  width: number,
  minConfidence: number
): { centerX: number; confidence: number } | null {
  const keypoints = pose?.keypoints?.filter((point) => (point.score ?? 0) >= minConfidence) ?? [];
  if (keypoints.length < 3 || width <= 0) return null;

  const minX = Math.min(...keypoints.map((point) => point.x));
  const maxX = Math.max(...keypoints.map((point) => point.x));
  const confidence = keypoints.reduce((sum, point) => sum + (point.score ?? 0), 0) / keypoints.length;

  return {
    centerX: Math.min(1, Math.max(0, ((minX + maxX) / 2) / width)),
    confidence,
  };
}

function smoothPoints(points: AutoReframePoint[], alpha: number): AutoReframePoint[] {
  let smoothed = 0.5;
  return points.map((point) => {
    smoothed = alpha * point.centerX + (1 - alpha) * smoothed;
    return { ...point, centerX: Number(smoothed.toFixed(4)) };
  });
}

export async function analyzeSubjectMotion(
  file: File,
  {
    fps = 3,
    maxSamples = 180,
    smoothingAlpha = 0.28,
    minConfidence = 0.2,
    onProgress,
    signal,
  }: AnalyzeOptions = {}
): Promise<AutoReframePoint[]> {
  if (typeof window === "undefined") return [];

  assertNotAborted(signal);
  onProgress?.(1);

  const detector = await loadDetector(signal);
  const { video, url } = await createVideo(file, signal);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  try {
    if (!ctx) throw new Error("Canvas is not available for subject tracking.");

    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

    const times = buildSampleTimes(video.duration, fps, maxSamples);
    const points: AutoReframePoint[] = [];
    let lastCenterX = 0.5;

    for (let index = 0; index < times.length; index += 1) {
      assertNotAborted(signal);
      const time = times[index] ?? 0;
      await seekVideo(video, time, signal);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const poses = await detector.estimatePoses(canvas, {
        maxPoses: 1,
        flipHorizontal: false,
      });
      assertNotAborted(signal);
      const subject = poseCenterX(poses[0], canvas.width, minConfidence);
      lastCenterX = subject?.centerX ?? lastCenterX;

      points.push({
        time: Number(time.toFixed(3)),
        centerX: lastCenterX,
        confidence: Number((subject?.confidence ?? 0).toFixed(3)),
      });

      onProgress?.(Math.round(((index + 1) / times.length) * 100));
      await waitForNextTask(signal);
    }

    return smoothPoints(points, smoothingAlpha);
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
    canvas.width = 0;
    canvas.height = 0;
    await disposeSubjectDetector();
  }
}
