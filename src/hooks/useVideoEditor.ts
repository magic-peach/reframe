"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { EditRecipe, ExportResult, ExportStatus, DEFAULT_RECIPE, ExportHistoryItem } from "@/lib/types";
import { loadFFmpeg, exportVideo, terminateFFmpeg } from "@/lib/ffmpeg";

const DEFAULT_TITLE = "Reframe — Resize, trim, and export videos in your browser";

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

      if (hex.startsWith('1A45DFA3')) resolve(true);
      else if (hex.startsWith('52494646')) resolve(true);
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
  
  const [rememberSettings, setRememberSettings] = useState<boolean>(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const exportAbortControllerRef = useRef<AbortController | null>(null);
  const exportCancelledRef = useRef(false);

  // --- Initialization (Hash & LocalStorage) ---
  useEffect(() => {
    const savedToggle = localStorage.getItem('rememberSettings') === 'true';
    setRememberSettings(savedToggle);

    // 1. Check URL Hash First (Highest Priority)
    if (window.location.hash && window.location.hash.length > 1) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const parsedRecipe: Partial<EditRecipe> = {};

        // Carefully cast strings back to proper types
        if (hashParams.has("preset")) parsedRecipe.preset = hashParams.get("preset")!;
        if (hashParams.has("customWidth")) parsedRecipe.customWidth = Number(hashParams.get("customWidth"));
        if (hashParams.has("customHeight")) parsedRecipe.customHeight = Number(hashParams.get("customHeight"));
        if (hashParams.has("framing")) parsedRecipe.framing = hashParams.get("framing") as "fit" | "fill";
        if (hashParams.has("trimStart")) parsedRecipe.trimStart = Number(hashParams.get("trimStart"));
        if (hashParams.has("trimEnd")) parsedRecipe.trimEnd = hashParams.get("trimEnd") === "null" ? null : Number(hashParams.get("trimEnd"));
        if (hashParams.has("rotate")) parsedRecipe.rotate = Number(hashParams.get("rotate")) as 0 | 90 | 180 | 270;
        if (hashParams.has("keepAudio")) parsedRecipe.keepAudio = hashParams.get("keepAudio") === "true";
        if (hashParams.has("speed")) parsedRecipe.speed = Number(hashParams.get("speed"));
        if (hashParams.has("quality")) parsedRecipe.quality = Number(hashParams.get("quality"));

        setRecipe((prev) => ({ ...prev, ...parsedRecipe }));
        return; // Skip localStorage if hash exists
      } catch (e) {
        console.error("Failed to parse URL hash settings", e);
      }
    }

    // 2. Fallback to LocalStorage
    if (savedToggle) {
      const savedRecipe = localStorage.getItem('videoEditorRecipe');
      if (savedRecipe) {
        try {
          setRecipe(JSON.parse(savedRecipe));
        } catch (error) {
          console.error("Failed to parse saved video recipe", error);
        }
      }
    }
  }, []);

  // --- Save to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('rememberSettings', String(rememberSettings));
    if (rememberSettings) {
      localStorage.setItem('videoEditorRecipe', JSON.stringify(recipe));
    } else {
      localStorage.removeItem('videoEditorRecipe');
    }
  }, [rememberSettings, recipe]);

  // --- NEW: Sync state to URL Hash ---
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(recipe).forEach(([key, value]) => {
      params.set(key, String(value));
    });
    
    // replaceState prevents creating a massive browser history
    window.history.replaceState(null, '', `#${params.toString()}`);
  }, [recipe]);

  const updateRecipe = useCallback((patch: Partial<EditRecipe>) => {
    setRecipe((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setResult(null);
    setStatus("idle");
    setError(null);
    setFile(null);

    const validExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    const name = selectedFile.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => name.endsWith(ext));
    if (!hasValidExtension) {
      setError(`Layer 1 Validation Failed: Invalid file extension. Expected one of: ${validExtensions.join(', ')}`);
      setStatus("error");
      return;
    }

    if (!selectedFile.type.startsWith("video/")) {
      setError(`Layer 2 Validation Failed: Invalid MIME type. Expected video/*, got ${selectedFile.type || 'unknown'}`);
      setStatus("error");
      return;
    }

    const isVideo = await verifyMagicBytes(selectedFile);
    if (!isVideo) {
      setError("Layer 3 Validation Failed: Invalid file content. The file's magic bytes do not match known video formats.");
      setStatus("error");
      return;
    }

    try {
      const dur = await getVideoDuration(selectedFile);
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

    const abortController = new AbortController();
    exportAbortControllerRef.current = abortController;
    exportCancelledRef.current = false;

    try {
      setStatus("loading-engine");
      setProgress(0);
      setError(null);
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
      
      setExportHistory((prevHistory) => {
        const newItem: ExportHistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          result: exportResult,
          recipe: recipe, 
        };

        const updatedHistory = [newItem, ...prevHistory];

        if (updatedHistory.length > 5) {
          URL.revokeObjectURL(updatedHistory[5].result.blobUrl);
        }

        return updatedHistory.slice(0, 5); 
      });

      setStatus("done");
    } catch (err) {
      if (exportCancelledRef.current) return;

      console.error("export failed:", err);
      setError(err instanceof Error ? err.message : "something went wrong");
      setStatus("error");
    } finally {
      if (exportAbortControllerRef.current === abortController) {
        exportAbortControllerRef.current = null;
      }
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
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && file && status === "idle") {
        handleExport();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
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

  const reset = useCallback(() => {
    setFile(null);
    setDuration(0);
    setRecipe(DEFAULT_RECIPE);
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

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
      exportHistory.forEach((item) => {
        URL.revokeObjectURL(item.result.blobUrl);
      });
    };
  }, [exportHistory]);

  return {
    file,
    duration,
    recipe,
    status,
    progress,
    result,
    error,
    rememberSettings,
    exportHistory,
    setRememberSettings,
    updateRecipe,
    handleFileSelect,
    handleExport,
    cancelExport,
    reset,
  };
}