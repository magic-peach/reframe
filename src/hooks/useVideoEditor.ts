"use client";

import { useState, useCallback } from "react";
import { EditRecipe, ExportResult, ExportStatus, DEFAULT_RECIPE } from "@/lib/types";
import { loadFFmpeg, exportVideo } from "@/lib/ffmpeg";

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
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
      resolve(0);
    };
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
    setFile(selectedFile);
    setResult(null);
    setStatus("idle");
    setError(null);
    setRecipe((prev) => ({ ...prev, trimStart: 0, trimEnd: null }));

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

  const reset = useCallback(() => {
    setFile(null);
    setDuration(0);
    setRecipe(DEFAULT_RECIPE);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

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
