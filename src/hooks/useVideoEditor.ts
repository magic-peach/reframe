"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  EditRecipe,
  ExportQueueItem,
  ExportResult,
  ExportStatus,
} from "@/lib/types";
import { DEFAULT_RECIPE } from "@/lib/constants";
import { loadFFmpeg, exportVideo, terminateFFmpeg, FFmpegLoadError } from "@/lib/ffmpeg";

const DEFAULT_TITLE = "Reframe — Resize, trim, and export videos in your browser";

export function extractMetadata(file: File): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: isFinite(video.duration) ? video.duration : 0,
      });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
    video.src = url;
  });
}

function verifyMagicBytes(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (!e.target?.result) {
        resolve(false);
        return;
      }
      const arr = new Uint8Array(e.target.result as ArrayBuffer);
      const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const ascii = String.fromCharCode(...arr);

      // WebM / MKV
      if (hex.startsWith('1A45DFA3')) resolve(true);
      // AVI
      else if (hex.startsWith('52494646')) resolve(true);
      // MP4 / MOV (checks for 'ftyp' in first 12 bytes)
      else if (ascii.substring(0, 12).includes('ftyp')) resolve(true);
      else resolve(false);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

type QueueUpdate = (queue: ExportQueueItem[]) => ExportQueueItem[];

function buildQueueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneRecipe(recipe: EditRecipe): EditRecipe {
  return { ...recipe };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof FFmpegLoadError) return err.message;
  if (err instanceof Error) return err.message;
  return "something went wrong";
}

export function useVideoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [recipe, setRecipe] = useState<EditRecipe>(DEFAULT_RECIPE);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<ExportQueueItem[]>([]);
  const [activeQueueId, setActiveQueueIdState] = useState<string | null>(null);

  const exportAbortControllerRef = useRef<AbortController | null>(null);
  const exportCancelledRef = useRef(false);
  const stopQueueAfterCancelRef = useRef(false);
  const queueProcessingRef = useRef(false);
  const queueRef = useRef<ExportQueueItem[]>([]);
  const resultRef = useRef<ExportResult | null>(null);
  const activeQueueIdRef = useRef<string | null>(null);

  const commitQueue = useCallback((update: QueueUpdate) => {
    const next = update(queueRef.current);
    queueRef.current = next;
    setQueue(next);
  }, []);

  const commitResult = useCallback((next: ExportResult | null) => {
    resultRef.current = next;
    setResult(next);
  }, []);

  const setActiveQueueId = useCallback((id: string | null) => {
    activeQueueIdRef.current = id;
    setActiveQueueIdState(id);
  }, []);

  const replaceResult = useCallback((next: ExportResult | null) => {
    const previous = resultRef.current;

    if (previous?.blobUrl && previous.blobUrl !== next?.blobUrl) {
      const usedByQueue = queueRef.current.some(
        (item) => item.result?.blobUrl === previous.blobUrl
      );

      if (!usedByQueue) {
        URL.revokeObjectURL(previous.blobUrl);
      }
    }

    commitResult(next);
  }, [commitResult]);

  const updateQueueItem = useCallback(
    (id: string, patch: Partial<ExportQueueItem>) => {
      commitQueue((items) =>
        items.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    [commitQueue]
  );

  const updateRecipe = useCallback((patch: Partial<EditRecipe>) => {
    setRecipe((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    replaceResult(null);
    setStatus("idle");
    setError(null);
    setFile(null);

    // LAYER 1: Extension check
    const validExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    const name = selectedFile.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => name.endsWith(ext));
    if (!hasValidExtension) {
      setError(`Layer 1 Validation Failed: Invalid file extension. Expected one of: ${validExtensions.join(', ')}`);
      setStatus("error");
      return;
    }

    // LAYER 2: MIME type check
    if (!selectedFile.type.startsWith("video/")) {
      setError(`Layer 2 Validation Failed: Invalid MIME type. Expected video/*, got ${selectedFile.type || 'unknown'}`);
      setStatus("error");
      return;
    }

    // LAYER 3: Magic Bytes Verification
    const isVideo = await verifyMagicBytes(selectedFile);
    if (!isVideo) {
      setError("Layer 3 Validation Failed: Invalid file content. The file's magic bytes do not match known video formats.");
      setStatus("error");
      return;
    }

    try {
      const { duration: dur } = await extractMetadata(selectedFile);
      setDuration(dur);
      setFile(selectedFile);
      setRecipe((prev) => ({ ...prev, trimStart: 0, trimEnd: null }));
    } catch (err) {
      setError(`Layer 4 Validation Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setStatus("error");
    }
  }, [replaceResult]);

  const runQueueItem = useCallback(async (item: ExportQueueItem) => {
    const abortController = new AbortController();
    exportAbortControllerRef.current = abortController;
    exportCancelledRef.current = false;

    try {
      setActiveQueueId(item.id);
      setStatus("loading-engine");
      setProgress(0);
      setError(null);
      replaceResult(null);
      updateQueueItem(item.id, {
        status: "loading-engine",
        progress: 0,
        error: null,
      });

      const ffmpeg = await loadFFmpeg(abortController.signal);
      if (exportCancelledRef.current) {
        updateQueueItem(item.id, { status: "cancelled", progress: 0 });
        return "cancelled" as const;
      }

      setStatus("exporting");
      updateQueueItem(item.id, { status: "exporting", progress: 0 });

      const exportResult = await exportVideo(
        ffmpeg,
        item.file,
        item.recipe,
        (percent) => {
          setProgress(percent);
          updateQueueItem(item.id, { progress: percent });
        },
        abortController.signal
      );
      if (exportCancelledRef.current) {
        URL.revokeObjectURL(exportResult.blobUrl);
        updateQueueItem(item.id, { status: "cancelled", progress: 0 });
        return "cancelled" as const;
      }

      replaceResult(exportResult);
      updateQueueItem(item.id, {
        status: "done",
        progress: 100,
        result: exportResult,
        error: null,
      });
      setStatus("done");
      setProgress(100);
      return "done" as const;
    } catch (err) {
      if (exportCancelledRef.current || abortController.signal.aborted) {
        updateQueueItem(item.id, { status: "cancelled", progress: 0 });
        return "cancelled" as const;
      }

      console.error("export failed:", err);
      const message = getErrorMessage(err);
      updateQueueItem(item.id, {
        status: "error",
        error: message,
        progress: 0,
      });
      setError(message);
      setStatus("error");
      return "error" as const;
    } finally {
      if (exportAbortControllerRef.current === abortController) {
        exportAbortControllerRef.current = null;
      }
    }
  }, [replaceResult, setActiveQueueId, updateQueueItem]);

  const processQueue = useCallback(async () => {
    if (queueProcessingRef.current) return;

    queueProcessingRef.current = true;
    stopQueueAfterCancelRef.current = false;

    try {
      while (!stopQueueAfterCancelRef.current) {
        const nextItem = queueRef.current.find((item) => item.status === "queued");

        if (!nextItem) break;

        const queueResult = await runQueueItem(nextItem);

        if (queueResult === "cancelled") break;
      }
    } finally {
      queueProcessingRef.current = false;
      setActiveQueueId(null);
    }
  }, [runQueueItem, setActiveQueueId]);

  const enqueueCurrentExport = useCallback(
    (startImmediately = false) => {
      if (!file) return null;

      const item: ExportQueueItem = {
        id: buildQueueId(),
        file,
        recipe: cloneRecipe(recipe),
        status: "queued",
        progress: 0,
        result: null,
        error: null,
        createdAt: Date.now(),
      };

      commitQueue((items) => [...items, item]);

      if (startImmediately) {
        void processQueue();
      }

      return item.id;
    },
    [commitQueue, file, processQueue, recipe]
  );

  const startQueue = useCallback(() => {
    void processQueue();
  }, [processQueue]);

  const handleExport = useCallback(async () => {
    if (!file) return;
    if (status === "loading-engine" || status === "exporting") return;

    enqueueCurrentExport(true);
  }, [enqueueCurrentExport, file, status]);

  const removeQueueItem = useCallback(
    (id: string) => {
      if (activeQueueIdRef.current === id) return;

      const item = queueRef.current.find((queueItem) => queueItem.id === id);
      const blobUrl = item?.result?.blobUrl;

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);

        if (resultRef.current?.blobUrl === blobUrl) {
          commitResult(null);
        }
      }

      commitQueue((items) => items.filter((queueItem) => queueItem.id !== id));
    },
    [commitQueue, commitResult]
  );

  const retryQueueItem = useCallback(
    (id: string) => {
      if (activeQueueIdRef.current === id) return;

      const item = queueRef.current.find((queueItem) => queueItem.id === id);
      const blobUrl = item?.result?.blobUrl;

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);

        if (resultRef.current?.blobUrl === blobUrl) {
          commitResult(null);
        }
      }

      commitQueue((items) =>
        items.map((queueItem) =>
          queueItem.id === id
            ? {
                ...queueItem,
                status: "queued",
                progress: 0,
                result: null,
                error: null,
              }
            : queueItem
        )
      );
      void processQueue();
    },
    [commitQueue, commitResult, processQueue]
  );

  const clearQueue = useCallback(() => {
    const activeId = activeQueueIdRef.current;
    const removedItems = queueRef.current.filter((item) => item.id !== activeId);

    for (const item of removedItems) {
      const blobUrl = item.result?.blobUrl;

      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);

        if (resultRef.current?.blobUrl === blobUrl) {
          commitResult(null);
        }
      }
    }

    commitQueue((items) =>
      activeId ? items.filter((item) => item.id === activeId) : []
    );
  }, [commitQueue, commitResult]);

  useEffect(() => {
    if (file) {
      document.title = `Editing: ${file.name} | Reframe`;
    } else {
      document.title = DEFAULT_TITLE;
    }
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [file]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        file &&
        status !== "loading-engine" &&
        status !== "exporting"
      ) {
        handleExport();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [file, status, handleExport]);

  const cancelExport = useCallback(() => {
    exportCancelledRef.current = true;
    stopQueueAfterCancelRef.current = true;
    exportAbortControllerRef.current?.abort();
    exportAbortControllerRef.current = null;
    terminateFFmpeg();

    if (activeQueueIdRef.current) {
      updateQueueItem(activeQueueIdRef.current, {
        status: "cancelled",
        progress: 0,
      });
    }

    setActiveQueueId(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, [setActiveQueueId, updateQueueItem]);

  const resetSettings = useCallback(() => {
    setRecipe(DEFAULT_RECIPE);
  }, []);

  const reset = useCallback(() => {
    replaceResult(null);
    setFile(null);
    setDuration(0);
    setRecipe(DEFAULT_RECIPE);
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, [replaceResult]);

  // Development-only memory monitoring during export
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (status !== "exporting") return;

    const interval = setInterval(() => {
      const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      if (mem) {
        console.log("[Reframe Memory]", Math.round(mem.usedJSHeapSize / 1e6), "MB used");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    return () => {
      const blobUrls = new Set<string>();

      if (resultRef.current?.blobUrl) {
        blobUrls.add(resultRef.current.blobUrl);
      }

      for (const item of queueRef.current) {
        if (item.result?.blobUrl) {
          blobUrls.add(item.result.blobUrl);
        }
      }

      for (const blobUrl of blobUrls) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, []);

  return {
    file,
    duration,
    recipe,
    status,
    progress,
    result,
    error,
    queue,
    activeQueueId,
    updateRecipe,
    handleFileSelect,
    handleExport,
    enqueueCurrentExport,
    startQueue,
    cancelExport,
    removeQueueItem,
    retryQueueItem,
    clearQueue,
    reset,
    resetSettings,
  };
}
