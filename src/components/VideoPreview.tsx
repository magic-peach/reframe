/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
"use client";

import React, { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe, TextOverlay } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";
import { Camera, Move, RotateCcw } from "lucide-react";
import ComparisonPreview from "./ComparisonPreview";
import DraggableTextOverlays from "./DraggableTextOverlays";

interface Props {
  file: File | null;
  recipe: EditRecipe;
  videoRef: RefObject<HTMLVideoElement | null>;
  selectedTextId?: string | null;
  onSelectText?: (id: string | null) => void;
  onUpdateText?: (id: string, updates: Partial<TextOverlay>) => void;
  onChange?: (patch: Partial<EditRecipe>) => void;
}

export default function VideoPreview({
  file,
  recipe,
  videoRef,
  selectedTextId = null,
  onSelectText,
  onUpdateText,
  onChange,
}: Props) {
  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef<(() => void) | null>(null);

  // For draggable framing
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0, px: 0, py: 0 });

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

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDimensions({
        w: videoRef.current.videoWidth,
        h: videoRef.current.videoHeight,
      });
      setIsLoading(false);
    }
  };

  /**
   * Track preview container dimensions for text overlay positioning.
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (previewContainerRef.current) {
        const rect = previewContainerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const getTargetDimensions = () => {
    if (recipe.preset === "custom") {
      return { w: recipe.customWidth, h: recipe.customHeight };
    }
    const preset = getPresetById(recipe.preset);
    return { w: preset?.width ?? 1920, h: preset?.height ?? 1080 };
  };

  const target = getTargetDimensions();
  const targetRatio = target.w / target.h;
  const videoRatio = dimensions ? dimensions.w / dimensions.h : 16 / 9;

  const isFill = recipe.framing === "fill";

  const getStyle = (): React.CSSProperties => {
    if (!dimensions) return { width: "100%", height: "100%" };
    
    if (isFill) {
      if (videoRatio > targetRatio) {
        const overflowPercent = (videoRatio / targetRatio - 1) * 100;
        return {
          height: "100%",
          width: `${(videoRatio / targetRatio) * 100}%`,
          left: `${-overflowPercent * ((recipe.positionX ?? 50) / 100)}%`,
          top: 0,
        };
      } else {
        const overflowPercent = (targetRatio / videoRatio - 1) * 100;
        return {
          width: "100%",
          height: `${(targetRatio / videoRatio) * 100}%`,
          top: `${-overflowPercent * ((recipe.positionY ?? 50) / 100)}%`,
          left: 0,
        };
      }
    } else {
      if (videoRatio > targetRatio) {
        const emptyPercent = (1 - targetRatio / videoRatio) * 100;
        return {
          width: "100%",
          height: `${(targetRatio / videoRatio) * 100}%`,
          top: `${emptyPercent * ((recipe.positionY ?? 50) / 100)}%`,
          left: 0,
        };
      } else {
        const emptyPercent = (1 - videoRatio / targetRatio) * 100;
        return {
          height: "100%",
          width: `${(videoRatio / targetRatio) * 100}%`,
          left: `${emptyPercent * ((recipe.positionX ?? 50) / 100)}%`,
          top: 0,
        };
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.draggable-text-overlay')) return;

    setIsDragging(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      px: recipe.positionX ?? 50,
      py: recipe.positionY ?? 50,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !previewContainerRef.current || !dimensions || !onChange) return;

      const rect = previewContainerRef.current.getBoundingClientRect();
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;

      if (isFill) {
        if (videoRatio > targetRatio) {
          const overflowPixels = rect.height * videoRatio - rect.width;
          const moveX = (dx / overflowPixels) * 100;
          onChange({ positionX: Math.max(0, Math.min(100, startPos.current.px - moveX)) });
        } else {
          const overflowPixels = rect.width / videoRatio - rect.height;
          const moveY = (dy / overflowPixels) * 100;
          onChange({ positionY: Math.max(0, Math.min(100, startPos.current.py - moveY)) });
        }
      } else {
        if (videoRatio > targetRatio) {
          const emptyPixels = rect.height - rect.width / videoRatio;
          const moveY = (dy / emptyPixels) * 100;
          onChange({ positionY: Math.max(0, Math.min(100, startPos.current.py + moveY)) });
        } else {
          const emptyPixels = rect.width - rect.height * videoRatio;
          const moveX = (dx / emptyPixels) * 100;
          onChange({ positionX: Math.max(0, Math.min(100, startPos.current.px + moveX)) });
        }
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dimensions, isFill, targetRatio, videoRatio, onChange]);

  if (!file) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "Space") {
      const targetElement = e.target as HTMLElement;
      if (
        targetElement.tagName === "INPUT" ||
        targetElement.tagName === "TEXTAREA" ||
        targetElement.isContentEditable
      ) {
        return;
      }

      const video = videoRef.current;
      if (video) {
        e.preventDefault();
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-film-100 text-film-700 text-[10px] font-bold uppercase tracking-wider">
            <Move size={10} />
            Interactive Preview
          </span>
          <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-widest">
            Drag video to adjust framing
          </p>
        </div>
        {onChange && (
          <button
            onClick={() => onChange({ positionX: 50, positionY: 50 })}
            className="text-[10px] flex items-center gap-1 font-bold text-[var(--muted)] hover:text-film-600 transition-colors uppercase tracking-widest"
          >
            <RotateCcw size={10} />
            Reset Position
          </button>
        )}
      </div>

      <div
        ref={previewContainerRef}
        role="group"
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-[#050505] shadow-2xl border border-[var(--border)] group focus:outline-none focus-visible:ring-2 focus-visible:ring-film-500",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ aspectRatio: `${target.w} / ${target.h}`, maxHeight: "60vh", margin: "0 auto" }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        aria-label="Video preview (press Space to play/pause, drag to reposition)"
      >
        {isLoading && (
          <div
            className="absolute inset-0 animate-pulse bg-[var(--surface)] transition-opacity duration-300 z-10"
            aria-label="Loading video preview"
          />
        )}
        
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          onLoadedMetadata={onLoadedMetadata}
          className={cn("absolute pointer-events-none max-w-none transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
          style={getStyle()}
          playsInline
          muted={!recipe.keepAudio}
        >
          <track kind="captions" />
        </video>
        
        {/* Safe Area / Center Guide */}
        <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/10" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-white/10" />
        </div>

        {/* Draggable Text Overlays */}
        {!isLoading && containerDimensions.width > 0 && (
          <DraggableTextOverlays
            recipe={recipe}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            selectedTextId={selectedTextId ?? null}
            onSelectText={onSelectText || (() => {})}
            onUpdateText={onUpdateText || (() => {})}
          />
        )}

        {/* Compare button */}
        {!isLoading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowComparison((v) => !v); }}
            className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-20 pointer-events-auto ${
              showComparison
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"
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
            onClick={(e) => { e.stopPropagation(); handleGrabFrame(); }}
            className="absolute top-2 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-20 pointer-events-auto bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)] flex items-center gap-1"
            aria-label="Grab frame as PNG"
            title="Download current frame as PNG"
          >
            <Camera className="w-3 h-3" />
            Grab frame
          </button>
        )}
      </div>

      {showComparison && (
        <div className="mt-4">
          <ComparisonPreview file={file} recipe={recipe} videoRef={videoRef} />
        </div>
      )}
    </div>
  );
}
