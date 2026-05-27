/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe, TextOverlay } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";
import { Camera, Maximize, Minimize } from "lucide-react";
import ComparisonPreview from "./ComparisonPreview";
import DraggableTextOverlays from "./DraggableTextOverlays";

interface Props {
  file: File | null;
  recipe?: EditRecipe;
  videoRef: RefObject<HTMLVideoElement | null>;
  selectedTextId?: string | null;
  onSelectText?: (id: string | null) => void;
  onUpdateText?: (id: string, updates: Partial<TextOverlay>) => void;
  isCropping?: boolean;
  setIsCropping?: (val: boolean) => void;
  onUpdateRecipe?: (patch: Partial<EditRecipe>) => void;
}

export default function VideoPreview({
  file,
  recipe,
  videoRef,
  selectedTextId = null,
  onSelectText,
  onUpdateText,
  isCropping = false,
  setIsCropping,
  onUpdateRecipe,
}: Props) {
  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [videoDisplayRect, setVideoDisplayRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [tempCropArea, setTempCropArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: 100, height: 100 });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const [durationState, setDurationState] = useState(0);
  const [isMuted, setIsMuted] = useState(recipe?.keepAudio === false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTimeState(video.currentTime);
    const handleDurationChange = () => setDurationState(video.duration);
    const handleVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("volumechange", handleVolumeChange);

    // Initial values
    setIsPlaying(!video.paused);
    setCurrentTimeState(video.currentTime);
    setDurationState(video.duration || 0);
    setIsMuted(video.muted);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [videoRef, file]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => { });
    } else {
      video.pause();
    }
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMute = !video.muted;
    video.muted = nextMute;
    setIsMuted(nextMute);
    if (onUpdateRecipe) {
      onUpdateRecipe({ keepAudio: !nextMute });
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Number(e.target.value);
    video.currentTime = newTime;
    setCurrentTimeState(newTime);
  };

  const updateVideoDisplayRect = useCallback(() => {
    const video = videoRef.current;
    const container = previewContainerRef.current;
    if (!video || !container || !video.videoWidth || !video.videoHeight) return;

    let videoRatio = video.videoWidth / video.videoHeight;
    if (recipe?.cropArea && !isCropping) {
      videoRatio = (video.videoWidth * (recipe.cropArea.width / 100)) / (video.videoHeight * (recipe.cropArea.height / 100));
    }
    const containerRect = container.getBoundingClientRect();
    const containerRatio = containerRect.width / containerRect.height;

    let width = containerRect.width;
    let height = containerRect.height;
    let left = 0;
    let top = 0;

    if (videoRatio > containerRatio) {
      // Video is wider than container -> pillarboxed top/bottom
      height = containerRect.width / videoRatio;
      top = (containerRect.height - height) / 2;
    } else {
      // Video is taller than container -> pillarboxed left/right
      width = containerRect.height * videoRatio;
      left = (containerRect.width - width) / 2;
    }

    setVideoDisplayRect({ left, top, width, height });
  }, [videoRef, isCropping, recipe?.cropArea]);

  const handleToggleFullscreen = () => {
    const container = previewContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Wait a frame for container size to settle
      setTimeout(updateVideoDisplayRect, 50);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [updateVideoDisplayRect]);

  // Update rect on video load, resize, or when cropping is toggled
  useEffect(() => {
    updateVideoDisplayRect();
    window.addEventListener("resize", updateVideoDisplayRect);
    return () => window.removeEventListener("resize", updateVideoDisplayRect);
  }, [updateVideoDisplayRect, file, recipe?.rotate, isLoading, isFullscreen]);

  // Pause video and initialize temp crop area when cropping is toggled
  useEffect(() => {
    if (isCropping && recipe) {
      setTempCropArea(recipe.cropArea || { x: 0, y: 0, width: 100, height: 100 });
      if (videoRef.current) {
        videoRef.current.pause();
      }
      updateVideoDisplayRect();
    }
  }, [isCropping, recipe, videoRef, updateVideoDisplayRect]);

  const handleDragStart = (
    handle: "move" | "nw" | "ne" | "sw" | "se",
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.preventDefault();
    if (!videoDisplayRect) return;

    const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    const startX = clientX;
    const startY = clientY;
    const initialCrop = { ...tempCropArea };

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = "touches" in moveEvent ? (moveEvent.touches[0]?.clientX ?? 0) : moveEvent.clientX;
      const currentY = "touches" in moveEvent ? (moveEvent.touches[0]?.clientY ?? 0) : moveEvent.clientY;

      const dx = currentX - startX;
      const dy = currentY - startY;

      // Convert pixel deltas to percentage of videoDisplayRect dimensions
      const pctDx = (dx / videoDisplayRect.width) * 100;
      const pctDy = (dy / videoDisplayRect.height) * 100;

      let newX = initialCrop.x;
      let newY = initialCrop.y;
      let newWidth = initialCrop.width;
      let newHeight = initialCrop.height;

      if (handle === "move") {
        newX = Math.max(0, Math.min(100 - initialCrop.width, initialCrop.x + pctDx));
        newY = Math.max(0, Math.min(100 - initialCrop.height, initialCrop.y + pctDy));
      } else {
        // Horizontal resizing
        if (handle.includes("w")) {
          const maxDragX = initialCrop.x + initialCrop.width - 10;
          newX = Math.max(0, Math.min(maxDragX, initialCrop.x + pctDx));
          newWidth = initialCrop.x + initialCrop.width - newX;
        } else if (handle.includes("e")) {
          newWidth = Math.max(10, Math.min(100 - initialCrop.x, initialCrop.width + pctDx));
        }

        // Vertical resizing
        if (handle.includes("n")) {
          const maxDragY = initialCrop.y + initialCrop.height - 10;
          newY = Math.max(0, Math.min(maxDragY, initialCrop.y + pctDy));
          newHeight = initialCrop.y + initialCrop.height - newY;
        } else if (handle.includes("s")) {
          newHeight = Math.max(10, Math.min(100 - initialCrop.y, initialCrop.height + pctDy));
        }
      }

      setTempCropArea({
        x: Math.round(newX * 100) / 100,
        y: Math.round(newY * 100) / 100,
        width: Math.round(newWidth * 100) / 100,
        height: Math.round(newHeight * 100) / 100,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
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
      video.play().catch(() => { });
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

  const overlay = (() => {
    if (!recipe || !showOverlay || isCropping) return null;

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
        target.isContentEditable ||
        isCropping
      ) {
        return;
      }

      const video = videoRef.current;
      if (video) {
        e.preventDefault(); // Prevent default page scroll
        if (video.paused) {
          video.play().catch(() => { });
        } else {
          video.pause();
        }
      }
    }
  };

  return (
    <>
      <div
        ref={previewContainerRef}
        role="group"
        className="relative w-full rounded-lg overflow-hidden bg-[var(--bg)] aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Video preview (press Space to play/pause)"
      >
        {isLoading && (
          <div
            className="absolute inset-0 animate-pulse bg-[var(--surface)] rounded-xl transition-opacity duration-300"
            aria-label="Loading video preview"
          />
        )}
        {/* Cropped Video Container Wrapper */}
        <div
          className={cn(
            "absolute transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          style={
            recipe?.cropArea && !isCropping && videoDisplayRect
              ? {
                left: videoDisplayRect.left,
                top: videoDisplayRect.top,
                width: videoDisplayRect.width,
                height: videoDisplayRect.height,
                overflow: "hidden",
              }
              : {
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
              }
          }
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            controls={false}
            className="absolute"
            style={
              recipe?.cropArea && !isCropping
                ? {
                  left: (-recipe.cropArea.x * (100 / recipe.cropArea.width)) + "%",
                  top: (-recipe.cropArea.y * (100 / recipe.cropArea.height)) + "%",
                  width: ((100 / recipe.cropArea.width) * 100) + "%",
                  height: ((100 / recipe.cropArea.height) * 100) + "%",
                  maxWidth: "none",
                  maxHeight: "none",
                  objectFit: "fill",
                }
                : {
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }
            }
            onLoadedData={() => setIsLoading(false)}
            playsInline
            muted={!recipe?.keepAudio}
          >
            <track kind="captions" />
          </video>
        </div>

        {/* Letterbox / Crop overlay */}
        {overlay && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {overlay.mode === "fit" ? (
              // Letterbox: semi-transparent bars outside the content area
              <>
                <div className="absolute left-0 right-0 top-0 bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]" style={{ height: overlay.barTop }} />
                <div className="absolute left-0 right-0 bottom-0 bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]" style={{ height: overlay.barBottom }} />
                <div className="absolute top-0 bottom-0 left-0 bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]" style={{ width: overlay.barLeft }} />
                <div className="absolute top-0 bottom-0 right-0 bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]" style={{ width: overlay.barRight }} />
              </>
            ) : (
              // Fill/crop: dashed border around the surviving area, dimmed outside
              <>
                <div className="absolute left-0 right-0 top-0 bg-[var(--error-bg)]" style={{ height: overlay.barTop }} />
                <div className="absolute left-0 right-0 bottom-0 bg-[var(--error-bg)]" style={{ height: overlay.barBottom }} />
                <div className="absolute top-0 bottom-0 left-0 bg-[var(--error-bg)]" style={{ width: overlay.barLeft }} />
                <div className="absolute top-0 bottom-0 right-0 bg-[var(--error-bg)]" style={{ width: overlay.barRight }} />
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

        {/* 3x3 Grid Overlay */}
        {showGridOverlay && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {/* Vertical lines */}
            <div className="absolute top-0 bottom-0 left-1/3 border-l-2 border-dotted border-black" />
            <div className="absolute top-0 bottom-0 right-1/3 border-l-2 border-dotted border-black" />
            {/* Horizontal lines */}
            <div className="absolute left-0 right-0 top-1/3 border-t-2 border-dotted border-black" />
            <div className="absolute left-0 right-0 bottom-1/3 border-t-2 border-dotted border-black" />
          </div>
        )}

        {/* Draggable Text Overlays */}
        {recipe && !isLoading && !isCropping && containerDimensions.width > 0 && (
          <DraggableTextOverlays
            recipe={recipe}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            selectedTextId={selectedTextId ?? null}
            onSelectText={onSelectText || (() => { })}
            onUpdateText={onUpdateText || (() => { })}
          />
        )}

        {/* Interactive Video Crop Mask Overlay */}
        {isCropping && videoDisplayRect && (
          <div
            className="absolute z-20 pointer-events-auto select-none"
            style={{
              left: videoDisplayRect.left,
              top: videoDisplayRect.top,
              width: videoDisplayRect.width,
              height: videoDisplayRect.height,
            }}
          >
            {/* Backdrop Dimming Masks */}
            <div className="absolute left-0 right-0 top-0 bg-black/65" style={{ height: `${tempCropArea.y}%` }} />
            <div className="absolute left-0 right-0 bottom-0 bg-black/65" style={{ top: `${tempCropArea.y + tempCropArea.height}%` }} />
            <div className="absolute left-0 bg-black/65" style={{ top: `${tempCropArea.y}%`, height: `${tempCropArea.height}%`, width: `${tempCropArea.x}%` }} />
            <div className="absolute right-0 bg-black/65" style={{ top: `${tempCropArea.y}%`, height: `${tempCropArea.height}%`, left: `${tempCropArea.x + tempCropArea.width}%` }} />

            {/* Crop Boundary & Handles */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Crop selection area. Drag to reposition."
              className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{
                left: `${tempCropArea.x}%`,
                top: `${tempCropArea.y}%`,
                width: `${tempCropArea.width}%`,
                height: `${tempCropArea.height}%`,
              }}
              onMouseDown={(e) => handleDragStart("move", e)}
              onTouchStart={(e) => handleDragStart("move", e)}
            >
              {/* Grid Lines (Rule of Thirds) */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full h-px border-t border-dashed border-white/30 mt-[33.3%]" />
                <div className="w-full h-px border-t border-dashed border-white/30 mb-[33.3%]" />
              </div>
              <div className="absolute inset-0 flex justify-between pointer-events-none">
                <div className="h-full w-px border-l border-dashed border-white/30 ml-[33.3%]" />
                <div className="h-full w-px border-l border-dashed border-white/30 mr-[33.3%]" />
              </div>

              {/* Resize Corners */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Top-left resize handle."
                className="absolute -top-1 -left-1 w-5 h-5 border-t-[4px] border-l-[4px] border-white cursor-nwse-resize drop-shadow focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                onMouseDown={(e) => { e.stopPropagation(); handleDragStart("nw", e); }}
                onTouchStart={(e) => { e.stopPropagation(); handleDragStart("nw", e); }}
              />
              <div
                role="button"
                tabIndex={0}
                aria-label="Top-right resize handle."
                className="absolute -top-1 -right-1 w-5 h-5 border-t-[4px] border-r-[4px] border-white cursor-nesw-resize drop-shadow focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                onMouseDown={(e) => { e.stopPropagation(); handleDragStart("ne", e); }}
                onTouchStart={(e) => { e.stopPropagation(); handleDragStart("ne", e); }}
              />
              <div
                role="button"
                tabIndex={0}
                aria-label="Bottom-left resize handle."
                className="absolute -bottom-1 -left-1 w-5 h-5 border-b-[4px] border-l-[4px] border-white cursor-nesw-resize drop-shadow focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                onMouseDown={(e) => { e.stopPropagation(); handleDragStart("sw", e); }}
                onTouchStart={(e) => { e.stopPropagation(); handleDragStart("sw", e); }}
              />
              <div
                role="button"
                tabIndex={0}
                aria-label="Bottom-right resize handle."
                className="absolute -bottom-1 -right-1 w-5 h-5 border-b-[4px] border-r-[4px] border-white cursor-nwse-resize drop-shadow focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                onMouseDown={(e) => { e.stopPropagation(); handleDragStart("se", e); }}
                onTouchStart={(e) => { e.stopPropagation(); handleDragStart("se", e); }}
              />
            </div>

            {/* Floating Action Controls */}
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-full shadow-2xl px-4 py-2 pointer-events-auto z-30 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setIsCropping?.(false);
                }}
                className="px-3.5 py-1.5 rounded-full hover:bg-[var(--border)] text-xs font-heading font-semibold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                Cancel
              </button>
              <div className="w-px h-4 bg-[var(--border)]" />
              <button
                type="button"
                onClick={() => {
                  // Re-evaluate if the crop area is basically 100% of the video
                  if (
                    tempCropArea.x <= 0.1 &&
                    tempCropArea.y <= 0.1 &&
                    tempCropArea.width >= 99.8 &&
                    tempCropArea.height >= 99.8
                  ) {
                    onUpdateRecipe?.({ cropArea: undefined });
                  } else {
                    onUpdateRecipe?.({ cropArea: tempCropArea });
                  }
                  setIsCropping?.(false);
                }}
                className="px-4 py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Toggle button */}
        {recipe && !isLoading && !isCropping && (
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${showOverlay
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"
              }`}
            aria-pressed={showOverlay}
            aria-label={showOverlay ? "Hide framing overlay" : "Show framing overlay"}
            title={showOverlay ? "Hide framing overlay" : "Show framing overlay"}
          >
            {showOverlay ? "Hide overlay" : "Show overlay"}
          </button>
        )}

        {!isLoading && !isCropping && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex items-center justify-between px-4 text-white z-10 pointer-events-auto transition-opacity duration-200">
            {/* Play/Pause Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <span className="text-xs font-mono select-none">
                {formatTime(currentTimeState)} / {formatTime(durationState)}
              </span>
            </div>

            <div className="flex-1 mx-4 flex items-center">
              <input
                type="range"
                min={0}
                max={durationState || 100}
                step={0.05}
                value={currentTimeState}
                onChange={handleProgressChange}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--accent)] hover:h-1.5 transition-all"
                aria-label="Seek video progress"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleMute}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M11 5 6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Toggle fullscreen"
                title="Toggle fullscreen mode"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
        {/* Grid overlay button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowGridOverlay((v) => !v)}
            className={`absolute top-2 left-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${
              showGridOverlay
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"
            }`}
            aria-pressed={showGridOverlay}
            aria-label={showGridOverlay ? "Hide grid overlay" : "Show grid overlay"}
            title={showGridOverlay ? "Hide grid overlay" : "Show grid overlay"}
          >
            {showGridOverlay ? "Hide grid" : "Show grid"}
          </button>
        )}

        {/* Compare button */}
        {recipe && !isLoading && !isCropping && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={`absolute top-2 right-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${showComparison
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
        {!isLoading && !isCropping && (
          <button
            type="button"
            onClick={handleGrabFrame}
            className="absolute top-2 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)] flex items-center gap-1"
            aria-label="Grab frame as PNG"
            title="Download current frame as PNG"
          >
            <Camera className="w-3 h-3" />
            Grab frame
          </button>
        )}
      </div>

      {showComparison && file && !isCropping && (
        <div className="mt-4">
          <ComparisonPreview file={file} recipe={recipe} videoRef={videoRef} />
        </div>
      )}
    </>
  );
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
