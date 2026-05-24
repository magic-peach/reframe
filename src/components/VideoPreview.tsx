/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe, OverlayPosition } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import ComparisonPreview from "./ComparisonPreview";

interface Props {
  file: File | null;
  recipe?: EditRecipe;
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayFile?: File | null;
  overlayPosition?: OverlayPosition;
  overlaySize?: number;
  overlayOpacity?: number;
  overlayX?: number | null;
  overlayY?: number | null;
  setOverlayX?: (x: number | null) => void;
  setOverlayY?: (y: number | null) => void;
}

export default function VideoPreview({
  file,
  recipe,
  videoRef,
  overlayFile,
  overlayPosition,
  overlaySize,
  overlayOpacity,
  overlayX,
  overlayY,
  setOverlayX,
  setOverlayY,
}: Props) {
  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const onLoadedRef = useRef<(() => void) | null>(null);

  const [overlayUrl, setOverlayUrl] = useState<string>("");
  const overlayDragRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayFile) {
      setOverlayUrl("");
      return;
    }
    const url = URL.createObjectURL(overlayFile);
    setOverlayUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [overlayFile]);

  const getOverlayStyle = () => {
    if (!overlayFile) return {};

    if (overlayX === undefined || overlayY === undefined || overlayX === null || overlayY === null) {
      const spacing = "20px";
      if (overlayPosition === "top-left") {
        return { left: spacing, top: spacing };
      }
      if (overlayPosition === "top-right") {
        return { right: spacing, top: spacing };
      }
      if (overlayPosition === "bottom-left") {
        return { left: spacing, bottom: spacing };
      }
      return { right: spacing, bottom: spacing };
    }

    return {
      left: `${overlayX}%`,
      top: `${overlayY}%`,
    };
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const getCoords = (evt: any) => {
      if (evt.touches && evt.touches.length > 0) {
        return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
      }
      return { x: evt.clientX, y: evt.clientY };
    };

    const startCoords = getCoords(e);
    const startX = startCoords.x;
    const startY = startCoords.y;

    let currentLeft = 20;
    let currentTop = 20;

    const overlayElement = overlayDragRef.current;
    if (overlayElement) {
      const overlayRect = overlayElement.getBoundingClientRect();
      currentLeft = overlayRect.left - rect.left;
      currentTop = overlayRect.top - rect.top;
    }

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const moveCoords = getCoords(moveEvent);
      const curX = moveCoords.x;
      const curY = moveCoords.y;

      const dx = curX - startX;
      const dy = curY - startY;

      let newLeft = currentLeft + dx;
      let newTop = currentTop + dy;

      const overlayW = overlaySize ?? 150;
      const overlayH = overlayElement ? overlayElement.clientHeight : overlayW * 0.75;

      newLeft = Math.max(0, Math.min(rect.width - overlayW, newLeft));
      newTop = Math.max(0, Math.min(rect.height - overlayH, newTop));

      const pctX = (newLeft / rect.width) * 100;
      const pctY = (newTop / rect.height) * 100;

      if (setOverlayX) setOverlayX(parseFloat(pctX.toFixed(2)));
      if (setOverlayY) setOverlayY(parseFloat(pctY.toFixed(2)));
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  };

  const handleGrabFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const totalSec = Math.floor(video.currentTime);
      const mins = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const secs = String(totalSec % 60).padStart(2, "0");
      const filename = `frame-${mins}m${secs}s.png`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [videoRef]);

  useEffect(() => {
    if (!file) return;

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    setIsLoading(true);
    const id = ++lastId.current;
    const url = URL.createObjectURL(file);

    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
    }
    urlRef.current = url;

    const video = videoRef.current;
    if (!video) return;

    video.src = url;
    video.load();

    const handleLoaded = () => {
      if (lastId.current !== id) return;
      video.play().catch(() => {});
    };

    onLoadedRef.current = handleLoaded;

    video.addEventListener("loadeddata", handleLoaded);

    return () => {
      if (onLoadedRef.current) {
        video.removeEventListener("loadeddata", onLoadedRef.current);
        onLoadedRef.current = null;
      }

      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      if (urlRef.current === url) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file, videoRef]);

  useEffect(() => {
    if (!videoRef.current || !recipe) return;
    videoRef.current.muted = !recipe.keepAudio;
  }, [recipe, videoRef]);

  useEffect(() => {
    if (!videoRef.current || !recipe) return;
    videoRef.current.playbackRate = recipe.speed;
  }, [recipe, videoRef]);

  const overlay = (() => {
    if (!recipe || !showOverlay) return null;

    const preset = recipe.preset === "custom"
      ? { width: recipe.customWidth, height: recipe.customHeight }
      : getPresetById(recipe.preset);

    if (!preset) return null;

    // Preview container is 16:9
    const containerW = 16;
    const containerH = 9;
    const containerRatio = containerW / containerH;   // 1.777…
    const outputRatio = preset.width / preset.height;

    if (recipe.framing === "fit") {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "Space") {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const video = videoRef.current;
      if (video) {
        e.preventDefault(); // Prevent default page scroll
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        role="group"
        className="relative w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-film-500"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Video preview (press Space to play/pause)"
      >
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
          className={cn("w-full h-full object-contain transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
          style={{
            filter: recipe
              ? `brightness(${1 + recipe.brightness}) contrast(${recipe.contrast}) saturate(${recipe.saturation})`
              : undefined,
          }}
          onLoadedData={() => setIsLoading(false)}
          playsInline
          muted={!recipe?.keepAudio}
        >
          <track kind="captions" />
        </video>

        {overlayFile && overlayUrl && (
          <div
            ref={overlayDragRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="absolute cursor-move select-none group border border-transparent hover:border-film-500 hover:shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-colors"
            style={{
              width: `${overlaySize}px`,
              opacity: (overlayOpacity ?? 100) / 100,
              zIndex: 40,
              ...getOverlayStyle(),
            }}
          >
            <img
              src={overlayUrl}
              alt="Overlay asset"
              className="w-full h-auto pointer-events-none"
            />
            <div className="absolute inset-0 bg-film-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm pointer-events-none" />
          </div>
        )}

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
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${
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

        {/* Compare button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={`absolute top-2 right-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${
              showComparison
                ? "bg-film-600 text-white"
                : "bg-black/60 text-white/70 hover:bg-black/80"
            }`}
            aria-pressed={showComparison}
            aria-label={showComparison ? "Hide comparison preview" : "Show comparison preview"}
            title={showComparison ? "Hide comparison preview" : "Show comparison preview"}
          >
            Compare
          </button>
        )}

        {/* Grab frame button */}
        {!isLoading && (
          <button
            type="button"
            onClick={handleGrabFrame}
            className="absolute top-2 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto bg-black/60 text-white/70 hover:bg-black/80 flex items-center gap-1"
            aria-label="Grab frame as PNG"
            title="Download current frame as PNG"
          >
            <Camera className="w-3 h-3" />
            Grab frame
          </button>
        )}
      </div>

      {showComparison && file && (
        <div className="mt-4">
          <ComparisonPreview
            file={file}
            recipe={recipe}
            videoRef={videoRef}
            overlayFile={overlayFile}
            overlayPosition={overlayPosition}
            overlaySize={overlaySize}
            overlayOpacity={overlayOpacity}
            overlayX={overlayX}
            overlayY={overlayY}
          />
        </div>
      )}
    </>
  );
}
