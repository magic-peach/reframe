"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  EditRecipe,
  ExportResult,
  ExportStatus,
  BatchExportProgress,
  DEFAULT_RECIPE,
} from "@/lib/types";
import {
  loadFFmpeg,
  exportVideo,
  terminateFFmpegEngine,
  buildExportFilename,
} from "@/lib/ffmpeg";
import { PRESETS } from "@/lib/presets";

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

function isAbortLikeError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error) {
    if (err.name === "AbortError") return true;
    // FFmpeg.wasm: "Message # 0 was aborted"
    if (/aborted/i.test(err.message)) return true;
  }
  return false;
}

function revokeResultUrls(results: ExportResult[] | null | undefined) {
  results?.forEach((r) => {
    try {
      URL.revokeObjectURL(r.blobUrl);
    } catch {
      /* noop */
    }
  });
}

function defaultBatchPresetIds(currentPreset: string): string[] {
  const ids = new Set<string>();
  ids.add(currentPreset);
  for (const p of PRESETS) {
    if (p.id === "custom") continue;
    if (ids.size >= 2) break;
    if (!ids.has(p.id)) ids.add(p.id);
  }
  if (ids.size < 2) {
    const fallback = PRESETS.find((p) => p.id !== "custom")?.id ?? "vertical-9-16";
    ids.add(fallback);
  }
  return [...ids];
}

export function useVideoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [recipe, setRecipe] = useState<EditRecipe>(DEFAULT_RECIPE);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [batchResults, setBatchResults] = useState<ExportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchPresetIds, setBatchPresetIds] = useState<string[]>(() =>
    defaultBatchPresetIds(DEFAULT_RECIPE.preset)
  );
  const [batchProgress, setBatchProgress] = useState<BatchExportProgress | null>(null);

  const exportAbortRef = useRef<AbortController | null>(null);
  const recipeRef = useRef(recipe);
  const batchPresetIdsRef = useRef(batchPresetIds);
  const resultRef = useRef(result);
  const batchResultsRef = useRef(batchResults);

  useEffect(() => {
    recipeRef.current = recipe;
  }, [recipe]);
  useEffect(() => {
    batchPresetIdsRef.current = batchPresetIds;
  }, [batchPresetIds]);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);
  useEffect(() => {
    batchResultsRef.current = batchResults;
  }, [batchResults]);

  const updateRecipe = useCallback((patch: Partial<EditRecipe>) => {
    setRecipe((prev) => ({ ...prev, ...patch }));
  }, []);

  const setBatchModeWrapped = useCallback((enabled: boolean) => {
    if (enabled) {
      setBatchMode(true);
      setBatchPresetIds((prev) =>
        prev.length >= 2 ? prev : defaultBatchPresetIds(recipeRef.current.preset)
      );
    } else {
      setBatchMode(false);
      const first = batchPresetIdsRef.current[0];
      if (first) setRecipe((r) => ({ ...r, preset: first }));
    }
  }, []);

  const toggleBatchPreset = useCallback((presetId: string) => {
    setBatchPresetIds((prev) => {
      if (prev.includes(presetId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== presetId);
      }
      return [...prev, presetId];
    });
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    revokeResultUrls(batchResultsRef.current);
    if (resultRef.current?.blobUrl) URL.revokeObjectURL(resultRef.current.blobUrl);

    setFile(selectedFile);
    setResult(null);
    setBatchResults(null);
    setStatus("idle");
    setError(null);
    setBatchProgress(null);
    setRecipe((prev) => ({ ...prev, trimStart: 0, trimEnd: null }));

    const dur = await getVideoDuration(selectedFile);
    setDuration(dur);
  }, []);

  const cancelExport = useCallback(() => {
    exportAbortRef.current?.abort();
    terminateFFmpegEngine();
  }, []);

  const handleExport = useCallback(async () => {
    if (!file) return;

    const currentRecipe = recipeRef.current;
    const ids = batchPresetIdsRef.current;

    if (batchMode && ids.length < 2) {
      setError("Select at least two presets for batch export.");
      setStatus("error");
      return;
    }

    exportAbortRef.current?.abort();

    const controller = new AbortController();
    exportAbortRef.current = controller;
    const { signal } = controller;

    revokeResultUrls(batchResultsRef.current);
    if (resultRef.current?.blobUrl) URL.revokeObjectURL(resultRef.current.blobUrl);
    setResult(null);
    setBatchResults(null);
    setError(null);
    setBatchProgress(null);

    const completed: ExportResult[] = [];

    try {
      setStatus("loading-engine");
      setProgress(0);

      const ffmpeg = await loadFFmpeg(signal);
      setStatus("exporting");

      if (!batchMode) {
        const exportResult = await exportVideo(ffmpeg, file, currentRecipe, setProgress, { signal });
        const filename = buildExportFilename(
          currentRecipe.preset,
          exportResult.width,
          exportResult.height,
          exportResult.format
        );
        setResult({
          ...exportResult,
          filename,
          presetId: currentRecipe.preset,
        });
        setStatus("done");
        return;
      }

      for (let i = 0; i < ids.length; i++) {
        if (signal.aborted) break;

        const presetId = ids[i];
        const recipeForJob: EditRecipe = { ...currentRecipe, preset: presetId };
        const dims =
          presetId === "custom"
            ? { w: currentRecipe.customWidth, h: currentRecipe.customHeight }
            : (() => {
                const p = PRESETS.find((x) => x.id === presetId);
                return { w: p?.width ?? 0, h: p?.height ?? 0 };
              })();
        const filename = buildExportFilename(
          presetId,
          Math.round((dims.w || 1920) / 2) * 2,
          Math.round((dims.h || 1080) / 2) * 2,
          "mp4"
        );

        setBatchProgress({
          current: i + 1,
          total: ids.length,
          filename,
        });
        setProgress(0);

        const exportResult = await exportVideo(ffmpeg, file, recipeForJob, setProgress, { signal });
        const outFilename = buildExportFilename(
          presetId,
          exportResult.width,
          exportResult.height,
          exportResult.format
        );

        completed.push({
          ...exportResult,
          filename: outFilename,
          presetId,
        });
      }

      if (signal.aborted) {
        if (completed.length > 0) {
          setBatchResults(completed);
          setStatus("done");
        } else {
          setStatus("cancelled");
        }
        return;
      }

      setBatchResults(completed);
      setStatus("done");
    } catch (err) {
      if (isAbortLikeError(err)) {
        if (completed.length > 0) {
          setBatchResults(completed);
          setStatus("done");
        } else {
          setStatus("cancelled");
        }
        return;
      }
      console.error("export failed:", err);
      if (batchMode && completed.length > 0) {
        setBatchResults(completed);
      }
      setError(err instanceof Error ? err.message : "something went wrong");
      setStatus("error");
    } finally {
      setBatchProgress(null);
      if (exportAbortRef.current === controller) {
        exportAbortRef.current = null;
      }
    }
  }, [file, batchMode]);

  const reset = useCallback(() => {
    revokeResultUrls(batchResultsRef.current);
    if (resultRef.current?.blobUrl) URL.revokeObjectURL(resultRef.current.blobUrl);
    exportAbortRef.current?.abort();
    terminateFFmpegEngine();

    setFile(null);
    setDuration(0);
    setRecipe(DEFAULT_RECIPE);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setBatchResults(null);
    setError(null);
    setBatchProgress(null);
    setBatchMode(false);
    setBatchPresetIds(defaultBatchPresetIds(DEFAULT_RECIPE.preset));
  }, []);

  const acknowledgeCancelled = useCallback(() => {
    setStatus("idle");
  }, []);

  return {
    file,
    duration,
    recipe,
    status,
    progress,
    result,
    batchResults,
    error,
    batchMode,
    batchPresetIds,
    batchProgress,
    updateRecipe,
    setBatchMode: setBatchModeWrapped,
    toggleBatchPreset,
    handleFileSelect,
    handleExport,
    cancelExport,
    reset,
    acknowledgeCancelled,
  };
}
