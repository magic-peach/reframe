"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { EditRecipe, ExportResult, ExportStatus } from "@/lib/types";
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

export function useVideoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [recipe, setRecipe] = useState<EditRecipe>(DEFAULT_RECIPE);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const exportAbortControllerRef = useRef<AbortController | null>(null);
  const exportCancelledRef = useRef(false);

  const updateRecipe = useCallback((patch: Partial<EditRecipe>) => {
    setRecipe((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setResult(null);
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
  }, []);

  const handleExport = useCallback(async () => {
    if (!file) return;
    if (status === "loading-engine" || status === "exporting") {
      return;
    }

    const abortController = new AbortController();
    exportAbortControllerRef.current = abortController;
    exportCancelledRef.current = false;

    try {
      setStatus("loading-engine");
      setProgress(0);
      setError(null);
      if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
      setResult(null);

      const ffmpeg = await loadFFmpeg(abortController.signal);
      if (exportCancelledRef.current) return;

      setStatus("exporting");

      const exportResult = await exportVideo(
        ffmpeg,
        file,
        recipe,
        setProgress,
        abortController.signal
      );
      if (exportCancelledRef.current) return;

      setResult(exportResult);
      setStatus("done");
    } catch (err) {
      if (exportCancelledRef.current) return;

      console.error("export failed:", err);
      if (err instanceof FFmpegLoadError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "something went wrong");
      }
      setStatus("error");
    } finally {
      if (exportAbortControllerRef.current === abortController) {
        exportAbortControllerRef.current = null;
      }
    }
  }, [file, recipe, result, status]);

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
    exportAbortControllerRef.current?.abort();
    exportAbortControllerRef.current = null;
    terminateFFmpeg();
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  const resetSettings = useCallback(() => {
    setRecipe(DEFAULT_RECIPE);
  }, []);

  const reset = useCallback(() => {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setFile(null);
    setDuration(0);
    setRecipe(DEFAULT_RECIPE);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, [result]);

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

  return {
    file,
    duration,
    recipe,
    status,
    progress,
    result,
    error,
    updateRecipe,
    handleFileSelect,
    handleExport,
    cancelExport,
    reset,
    resetSettings,
  };
}
