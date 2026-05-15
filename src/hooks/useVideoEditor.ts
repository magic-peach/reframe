"use client";

import { useState, useCallback, useEffect } from "react";
import { EditRecipe, ExportResult, ExportStatus, DEFAULT_RECIPE } from "@/lib/types";
import { loadFFmpeg, exportVideo } from "@/lib/ffmpeg";

const DEFAULT_TITLE = "Reframe — Resize, trim, and export videos in your browser";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video metadata. The file may be corrupt or simply not a video."));
    };
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

  const updateRecipe = useCallback((patch: Partial<EditRecipe>) => {
    setRecipe((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setDuration(0);
      setResult(null);
      setRecipe(DEFAULT_RECIPE);
      setProgress(0);

      setError(
        `File too large. Please upload a video smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      );

      setStatus("error");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setStatus("idle");
    setError(null);

    setRecipe((prev) => ({
      ...prev,
      trimStart: 0,
      trimEnd: null
    }));

    const dur = await getVideoDuration(selectedFile);
    setDuration(dur);

  }, []);

  const handleExport = useCallback(async () => {
    if (!file) return;

    try {
      setStatus("loading-engine");
      setProgress(0);
      setError(null);
      setResult(null);

      const ffmpeg = await loadFFmpeg();
      setStatus("exporting");

      const exportResult = await exportVideo(ffmpeg, file, recipe, setProgress);
      setResult(exportResult);
      setStatus("done");
    } catch (err) {
      console.error("export failed:", err);
      setError(err instanceof Error ? err.message : "something went wrong");
      setStatus("error");
    }
  }, [file, recipe]);

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
        status === "idle"
      ) {
        handleExport();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [file, status, handleExport]);
  const reset = useCallback(() => {
    setFile(null);
    setDuration(0);
    setRecipe(DEFAULT_RECIPE);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

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
    reset,
  };
}
