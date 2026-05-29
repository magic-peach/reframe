"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { EditRecipe, ExportResult, ExportStatus, MAX_FILE_SIZE, OverlayPosition, isValidRecipe } from "@/lib/types";
import { DEFAULT_RECIPE, SPEED_STEPS } from "@/lib/constants";
import { getPresetById } from "@/lib/presets";
import { loadFFmpeg, exportVideo, terminateFFmpeg, FFmpegLoadError } from "@/lib/ffmpeg";
import { suggestPreset } from "@/lib/presetSuggestion";
import { validateDimensions, getDownscaledDimensions } from "@/utils/video-validation";

const DEFAULT_TITLE = "Reframe — Resize, trim, and export videos in your browser";
const STORAGE_KEY = "reframe:recipe";

export function extractMetadata(file: File): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject( new Error("Video metaData load timeout — the file may be too large or the device too slow. Please try again.") );
    }, 5000);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      clearTimeout(timeout)
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: isFinite(video.duration) ? video.duration : 0,
      });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video metadata"));
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
      const hex = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      const ascii = String.fromCharCode(...arr);

      if (hex.startsWith("1A45DFA3")) resolve(true);
      else if (hex.startsWith("52494646")) resolve(true);
      else if (ascii.substring(0, 12).includes("ftyp")) resolve(true);
      else resolve(false);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

function validateRecipe(recipe: EditRecipe, duration: number ): string | null {
  const validations: Array<[boolean, string]> = [
    [recipe.trimStart < 0, "Trim start time cannot be less than 0 seconds."],
    [recipe.trimEnd !== null && duration > 0 && recipe.trimEnd > duration, `Trim end time cannot exceed the video duration (${Math.floor(duration)}s).`],
    [recipe.trimEnd !== null ? recipe.trimStart >= recipe.trimEnd : (duration > 0 && recipe.trimStart >= duration), "Trim start time must be earlier than the end time."],
    [recipe.preset === "custom" && (Number.isNaN(recipe.customWidth) || recipe.customWidth < 16 || recipe.customWidth > 7680), "Width must be between 16px and 7680px."],
    [recipe.preset === "custom" && (Number.isNaN(recipe.customHeight) || recipe.customHeight < 16 || recipe.customHeight > 7680), "Height must be between 16px and 7680px."],
    [!(SPEED_STEPS as readonly number[]).includes(recipe.speed), "Please select a valid playback speed."],
    [recipe.quality < 18 || recipe.quality > 30, "Quality must be between 18 and 30."],
    [recipe.brightness < -1 || recipe.brightness > 1, "Brightness must be between -1 and 1."],
    [recipe.contrast < 0 || recipe.contrast > 2, "Contrast must be between 0 and 2."],
    [recipe.saturation < 0 || recipe.saturation > 3, "Saturation must be between 0 and 3."],
  ];

  return validations.find(([condition]) => condition)?.[1] ?? null;
}

function encodeRecipe(recipe: EditRecipe): string {
  return btoa(JSON.stringify(recipe));
}

function decodeRecipe(encoded: string): Partial<EditRecipe> | null {
  try {
    const decoded = JSON.parse(atob(encoded));
    return decoded as Partial<EditRecipe>;
  } catch {
    return null;
  }
}

function migrateRecipe(recipe: Partial<EditRecipe>): EditRecipe {
  return {
    ...DEFAULT_RECIPE,
    ...recipe,
    textOverlays: Array.isArray(recipe.textOverlays) ? recipe.textOverlays : [],
  };
}

export function useVideoEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [videoMetadata, setVideoMetadata] = useState<{
    width: number;
    height: number;
    duration: number;
  } | null>(null);
  const [recipe, setRecipe] = useState<EditRecipe>(() => {
    if (typeof window === "undefined") return { ...DEFAULT_RECIPE };
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("settings");
    if (encoded) {
      const decoded = decodeRecipe(encoded);
      if (decoded) {
        return migrateRecipe(decoded);
      }
    }
    return migrateRecipe({
      soundOnCompletion:
        typeof window !== "undefined" &&
        localStorage.getItem("soundOnCompletion") === "true",
    });
  });
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [exportStartedAt, setExportStartedAt] = useState<number | null>(null);
  const exportAbortControllerRef = useRef<AbortController | null>(null);
  const exportCancelledRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState(70);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(40);
  const [loopMusic, setLoopMusic] = useState(false);

  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>("bottom-right");
  const [overlaySize, setOverlaySize] = useState(150);
  const [overlayOpacity, setOverlayOpacity] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);

  const updateRecipe = useCallback((patch: Partial<EditRecipe>) => {
    setRecipe((prev) => {
      const next = { ...prev, ...patch };
      if (next.format === "gif") {
        next.keepAudio = false;
      }
      return next;
    });
  }, []);

  // Performance Optimization Patch: Wrap multi-conditional verification matrix in strict useCallback (#188)
  const isValidValue = useCallback((key: keyof EditRecipe, val: any): boolean => {
    switch (key) {
      case "preset":
        return typeof val === "string";
      case "customWidth":
        return typeof val === "number" && !isNaN(val) && val >= 16 && val <= 7680;
      case "customHeight":
        return typeof val === "number" && !isNaN(val) && val >= 16 && val <= 7680;
      case "framing":
        return val === "fit" || val === "fill";
      case "trimStart":
        return typeof val === "number" && !isNaN(val) && val >= 0;
      case "trimEnd":
        return val === null || (typeof val === "number" && !isNaN(val) && val >= 0);
      case "rotate":
        return val === 0 || val === 90 || val === 180 || val === 270;
      case "speed":
        return typeof val === "number" && !isNaN(val) && [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].includes(val);
      case "quality":
        return typeof val === "number" && !isNaN(val) && val >= 18 && val <= 30;
      case "format":
        return val === "mp4" || val === "webm" || val === "mkv" || val === "gif";
      case "brightness":
        return typeof val === "number" && !isNaN(val);
      default:
        return true;
    }
  }, []);

  // Performance Optimization Patch: Memoize complex combined configuration parameters object reference mapping context
  const derivedEditorParameters = useMemo(() => {
    return {
      activeDimensions: videoMetadata ? { w: videoMetadata.width, h: videoMetadata.height } : null,
      recipeValidState: isValidRecipe(recipe),
      computedDuration: duration
    };
  }, [videoMetadata, recipe, duration]);

  return {
    file,
    setFile,
    duration,
    videoMetadata,
    recipe,
    updateRecipe,
    isValidValue,
    derivedEditorParameters,
    status,
    progress,
    result,
    error,
    fileError,
    setFileError,
    videoRef,
    musicFile,
    setMusicFile,
    musicVolume,
    setMusicVolume,
    originalAudioVolume,
    setOriginalAudioVolume,
    loopMusic,
    setLoopMusic,
    overlayFile,
    setOverlayFile,
    overlayPosition,
    setOverlayPosition,
    overlaySize,
    setOverlaySize,
    overlayOpacity,
    setOverlayOpacity,
    currentTime,
    setCurrentTime
  };
}
