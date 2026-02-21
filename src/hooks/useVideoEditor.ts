"use client";

import { useState, useCallback } from "react";
import { EditRecipe, ExportResult, ExportStatus, DEFAULT_RECIPE } from "@/lib/types";
import { loadFFmpeg, exportVideo } from "@/lib/ffmpeg";

export function useVideoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [recipe, setRecipe] = useState<EditRecipe>(DEFAULT_RECIPE);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateRecipe = useCallback((patch: Partial<EditRecipe>) => {
    setRecipe((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    // Reset results when a new file is selected
    setResult(null);
    setStatus("idle");
    setError(null);
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
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }, [file, recipe]);

  const reset = useCallback(() => {
    setFile(null);
    setRecipe(DEFAULT_RECIPE);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    file,
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
