"use client";


import { useEffect, useRef } from "react";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { captureFrameAsPng } from "@/lib/frame-export";
import { DEFAULT_RECIPE } from "@/lib/constants";


interface Props {
  file: File | null;
}

export default function VideoPreview({ file }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);


  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [frameNotice, setFrameNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [isExportingFrame, setIsExportingFrame] = useState(false);
  const isExportingFrameRef = useRef(false);
  const onLoadedRef = useRef<(() => void) | null>(null);
  const activeRecipe = recipe ?? DEFAULT_RECIPE;

  useEffect(() => {
    if (!frameNotice) return;

    const timeoutId = window.setTimeout(() => setFrameNotice(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [frameNotice]);

  /** Capture the current video frame and download it as a PNG. */
  const handleGrabFrame = useCallback(async () => {
    if (isExportingFrameRef.current) return;

    const video = videoRef.current;
    if (!video) {
      setFrameNotice({ kind: "error", message: "No video frame is available yet." });
      return;
    }

    isExportingFrameRef.current = true;
    setIsExportingFrame(true);

    try {
      const { blob, filename } = await captureFrameAsPng(video, activeRecipe);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFrameNotice({ kind: "success", message: `Saved ${filename}` });
    } catch (error) {
      console.error("frame export failed:", error);
      setFrameNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Frame export failed.",
      });
    } finally {
      isExportingFrameRef.current = false;
      setIsExportingFrame(false);
    }
  }, [activeRecipe, videoRef]);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "KeyT") {
        e.preventDefault();
        void handleGrabFrame();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [handleGrabFrame]);
  useEffect(() => {
    if (!file) return;

    // revoke previous object url to avoid memory leaks
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    if (videoRef.current) videoRef.current.src = url;

    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [file]);

  }, [file, videoRef]);

  /**
   * Compute the overlay geometry for the selected preset + framing mode.
   * The preview container always uses a 16:9 aspect-video box.
   * We express widths/heights as percentage strings for CSS.
   */
  const overlay = (() => {
    if (!activeRecipe || !showOverlay) return null;

    const preset = activeRecipe.preset === "custom"
      ? { width: activeRecipe.customWidth, height: activeRecipe.customHeight }
      : getPresetById(activeRecipe.preset);

    if (!preset) return null;

    // Preview container is 16:9
    const containerW = 16;
    const containerH = 9;
    const containerRatio = containerW / containerH;   // 1.777…
    const outputRatio = preset.width / preset.height;

    if (activeRecipe.framing === "fit") {
      // Letterbox: the output video fits entirely inside 16:9, padded with bars.
      if (outputRatio > containerRatio) {
        // Wider output → pillarbox bars on top & bottom
        const contentH = (containerRatio / outputRatio) * 100;
        const barH = (100 - contentH) / 2;
        return { mode: "fit", barTop: `${barH}%`, barBottom: `${barH}%`, barLeft: "0", barRight: "0" };
      } else {
        // Taller output → letterbox bars on left & right
        const contentW = (outputRatio / containerRatio) * 100;
        const barW = (100 - contentW) / 2;
        return { mode: "fit", barTop: "0", barBottom: "0", barLeft: `${barW}%`, barRight: `${barW}%` };
      }
    } else {
      // Fill / crop: the output fills the entire 16:9 preview — show a box representing what survives the crop.
      if (outputRatio < containerRatio) {
        // Output is taller → crops top & bottom
        const visibleH = (outputRatio / containerRatio) * 100;
        const cropH = (100 - visibleH) / 2;
        return { mode: "fill", barTop: `${cropH}%`, barBottom: `${cropH}%`, barLeft: "0", barRight: "0" };
      } else {
        // Output is wider → crops left & right
        const visibleW = (containerRatio / outputRatio) * 100;
        const cropW = (100 - visibleW) / 2;
        return { mode: "fill", barTop: "0", barBottom: "0", barLeft: `${cropW}%`, barRight: `${cropW}%` };
      }
    }
  })();

  if (!file) return null;

  return (
    <div className="w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video">

    <div
      role="group"
      className="relative w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-film-500"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Video preview (press Space to play/pause, T to export the current frame)"
    >
      {frameNotice && (
        <div
          className={cn(
            "absolute top-2 left-2 z-20 max-w-[calc(100%-5rem)] rounded-lg border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-sm animate-fade-in",
            frameNotice.kind === "success"
              ? "border-emerald-400/30 bg-emerald-950/85 text-emerald-100"
              : "border-red-400/30 bg-red-950/85 text-red-100"
          )}
          role="status"
          aria-live="polite"
        >
          {frameNotice.message}
        </div>
      )}
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-700 rounded-xl transition-opacity duration-300"
          aria-label="Loading video preview"
        />
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}

      <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain"
        playsInline
      />



      {/* Letterbox / Crop overlay */}
      {overlay && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {overlay.mode === "fit" ? (
            // Letterbox: semi-transparent bars outside the content area
            <>
              <div className="absolute left-0 right-0 top-0 bg-black/50" style={{ height: overlay.barTop }} />
              <div className="absolute left-0 right-0 bottom-0 bg-black/50" style={{ height: overlay.barBottom }} />
              <div className="absolute top-0 bottom-0 left-0 bg-black/50" style={{ width: overlay.barLeft }} />
              <div className="absolute top-0 bottom-0 right-0 bg-black/50" style={{ width: overlay.barRight }} />
            </>
          ) : (
            // Fill/crop: dashed border around the surviving area, dimmed outside
            <>
              <div className="absolute left-0 right-0 top-0 bg-red-900/50" style={{ height: overlay.barTop }} />
              <div className="absolute left-0 right-0 bottom-0 bg-red-900/50" style={{ height: overlay.barBottom }} />
              <div className="absolute top-0 bottom-0 left-0 bg-red-900/50" style={{ width: overlay.barLeft }} />
              <div className="absolute top-0 bottom-0 right-0 bg-red-900/50" style={{ width: overlay.barRight }} />
              <div
                className="absolute border-2 border-dashed border-film-400"
                style={{
                  top: overlay.barTop,
                  bottom: overlay.barBottom,
                  left: overlay.barLeft,
                  right: overlay.barRight,
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      {activeRecipe && !isLoading && (
        <button
          type="button"
          onClick={() => setShowOverlay((v) => !v)}
          className={`absolute bottom-10 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${
            showOverlay
              ? "bg-film-600 text-white"
              : "bg-black/60 text-white/70 hover:bg-black/80"
          }`}
          aria-pressed={showOverlay}
          aria-label={showOverlay ? "Hide framing overlay" : "Show framing overlay"}
          title={showOverlay ? "Hide framing overlay" : "Show framing overlay"}
        >
          {showOverlay ? "Hide overlay" : "Show overlay"}
        </button>
      )}

      {/* Grab frame button */}
      {!isLoading && (
        <button
          type="button"
          onClick={() => void handleGrabFrame()}
          disabled={isExportingFrame}
          className="absolute top-2 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto bg-black/60 text-white/70 hover:bg-black/80 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export current frame as PNG"
          aria-keyshortcuts="T"
          title="Export current frame as PNG (T)"
        >
          <Camera className="w-3 h-3" />
          {isExportingFrame ? "Exporting" : "Export frame"}
        </button>
      )}

    </div>
  );
}
