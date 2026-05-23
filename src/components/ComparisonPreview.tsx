/* eslint-disable jsx-a11y/no-static-element-interactions */
"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";

interface Props {
  file: File | null;
  recipe?: EditRecipe;
  videoRef: RefObject<HTMLVideoElement | null>;
}

export default function ComparisonPreview({ file, recipe, videoRef }: Props) {
  const leftVideoRef = useRef<HTMLVideoElement>(null);
  const rightVideoRef = useRef<HTMLVideoElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate overlay for the right (reframed) side
  const overlay = (() => {
    if (!recipe) return null;

    const preset = recipe.preset === "custom"
      ? { width: recipe.customWidth, height: recipe.customHeight }
      : getPresetById(recipe.preset);

    if (!preset) return null;

    const containerW = 16;
    const containerH = 9;
    const containerRatio = containerW / containerH;
    const outputRatio = preset.width / preset.height;

    if (recipe.framing === "fit") {
      if (outputRatio > containerRatio) {
        const contentH = (containerRatio / outputRatio) * 100;
        const barH = (100 - contentH) / 2;
        return { mode: "fit", barTop: `${barH}%`, barBottom: `${barH}%`, barLeft: "0", barRight: "0" };
      } else {
        const contentW = (outputRatio / containerRatio) * 100;
        const barW = (100 - contentW) / 2;
        return { mode: "fit", barTop: "0", barBottom: "0", barLeft: `${barW}%`, barRight: `${barW}%` };
      }
    } else {
      if (outputRatio < containerRatio) {
        const visibleH = (outputRatio / containerRatio) * 100;
        const cropH = (100 - visibleH) / 2;
        return { mode: "fill", barTop: `${cropH}%`, barBottom: `${cropH}%`, barLeft: "0", barRight: "0" };
      } else {
        const visibleW = (containerRatio / outputRatio) * 100;
        const cropW = (100 - visibleW) / 2;
        return { mode: "fill", barTop: "0", barBottom: "0", barLeft: `${cropW}%`, barRight: `${cropW}%` };
      }
    }
  })();

  // Load video source for both left and right videos
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);

    if (leftVideoRef.current) {
      leftVideoRef.current.src = url;
      leftVideoRef.current.load();
    }
    if (rightVideoRef.current) {
      rightVideoRef.current.src = url;
      rightVideoRef.current.load();
    }

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Sync right video with left video and auto-play left
  useEffect(() => {
    const leftVideo = leftVideoRef.current;
    const rightVideo = rightVideoRef.current;

    if (!leftVideo || !rightVideo || !file) return;

    const handleTimeUpdate = () => {
      rightVideo.currentTime = leftVideo.currentTime;
    };

    const handlePlay = () => {
      rightVideo.play().catch(() => {});
    };

    const handlePause = () => {
      rightVideo.pause();
    };

    const handleRateChange = () => {
      rightVideo.playbackRate = leftVideo.playbackRate;
    };

    const handleLoadedData = () => {
      leftVideo.play().catch(() => {});
    };

    leftVideo.addEventListener("timeupdate", handleTimeUpdate);
    leftVideo.addEventListener("play", handlePlay);
    leftVideo.addEventListener("pause", handlePause);
    leftVideo.addEventListener("ratechange", handleRateChange);
    leftVideo.addEventListener("loadeddata", handleLoadedData);

    return () => {
      leftVideo.removeEventListener("timeupdate", handleTimeUpdate);
      leftVideo.removeEventListener("play", handlePlay);
      leftVideo.removeEventListener("pause", handlePause);
      leftVideo.removeEventListener("ratechange", handleRateChange);
      leftVideo.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [file, videoRef]);

  // Handle slider dragging (mouse + touch)
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const container = containerRef.current;
      if (!container || !e.touches[0]) return;

      const rect = container.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  if (!file) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video"
      role="group"
      aria-label="Video comparison preview"
    >
      {/* Left side: Original video — clipped to left of slider */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={leftVideoRef}
          className="absolute inset-0 w-full h-full object-contain"
          playsInline
          muted
        >
          <track kind="captions" />
        </video>
      </div>

      {/* Right side: Reframed video with overlay — clipped to right of slider */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute inset-0" style={{ left: `-${sliderPosition}%`, right: 0 }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={rightVideoRef}
            className="w-full h-full object-contain"
            playsInline
            muted
            autoPlay
            loop
          >
            <track kind="captions" />
          </video>
        </div>

        {/* Overlay on reframed side */}
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
      </div>

      {/* Draggable divider slider */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-1 bg-white pointer-events-none transition-opacity",
          isDragging ? "opacity-100" : "opacity-75 hover:opacity-100"
        )}
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        aria-hidden="true"
      >
        {/* Circular drag handle */}
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className="absolute top-1/2 left-1/2 w-8 h-8 -ml-4 -mt-4 rounded-full bg-white shadow-lg pointer-events-auto cursor-grab active:cursor-grabbing flex items-center justify-center transition-shadow"
          style={{
            boxShadow: isDragging ? "0 0 12px rgba(255, 255, 255, 0.8)" : undefined,
          }}
          aria-label="Drag to compare original vs reframed"
          title="Drag left/right to compare"
        >
          <svg
            className="w-4 h-4 text-black"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 6h2v12H9V6zm4 0h2v12h-2V6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
