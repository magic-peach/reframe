/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe, TextOverlay } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import ComparisonPreview from "./ComparisonPreview";
import DraggableTextOverlays from "./DraggableTextOverlays";

interface Props {
  file: File | null;
  recipe?: EditRecipe;
  videoRef: RefObject<HTMLVideoElement | null>;
  selectedTextId?: string | null;
  onSelectText?: (id: string | null) => void;
  onUpdateText?: (id: string, updates: Partial<TextOverlay>) => void;
  overlayFile?: File | null;
  overlayPosition?: { x: number; y: number };
  overlaySize?: number;
  overlayOpacity?: number;
  setOverlayPosition?: (p: { x: number; y: number }) => void;
  setOverlaySize?: (size: number) => void;
}

export default function VideoPreview({
  file,
  recipe,
  videoRef,
  selectedTextId = null,
  onSelectText,
  onUpdateText,
  overlayFile,
  overlayPosition,
  overlaySize = 250,
  overlayOpacity = 100,
  setOverlayPosition,
  setOverlaySize,
}: Props) {
  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const innerCanvasRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef<(() => void) | null>(null);

  // High-performance DOM track nodes
  const overlayDOMRef = useRef<HTMLDivElement>(null);
  const canvasRectRef = useRef<DOMRect | null>(null); // Cached geometry to stop layout thrashing
  const dragStartCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStartSizeRef = useRef<number>(250);

  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [isResizingOverlay, setIsResizingOverlay] = useState(false);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);

  // Handle local memory compilation for overlay source files safely
  useEffect(() => {
    if (!overlayFile) {
      setOverlayUrl(null);
      return;
    }
    const url = URL.createObjectURL(overlayFile);
    setOverlayUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [overlayFile]);

  /** Capture the current video frame and download it as a PNG. */
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

  /** Track preview container dimensions for text overlay positioning. */
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

  // --- High-Performance Smooth Drag Node Operators ---
  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isResizingOverlay || !overlayPosition) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingOverlay(true);

    // Cache canvas metrics once at the beginning of interaction to eliminate layout thrashing
    if (innerCanvasRef.current) {
      canvasRectRef.current = innerCanvasRef.current.getBoundingClientRect();
    }

    dragStartCoordsRef.current = { x: e.clientX, y: e.clientY };
    dragStartPosRef.current = { x: overlayPosition.x, y: overlayPosition.y };
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingOverlay || !canvasRectRef.current || !overlayDOMRef.current)
      return;

    const rect = canvasRectRef.current; // Read instantly from memory cache
    const deltaX = e.clientX - dragStartCoordsRef.current.x;
    const deltaY = e.clientY - dragStartCoordsRef.current.y;

    const pctDeltaX = (deltaX / rect.width) * 100;
    const pctDeltaY = (deltaY / rect.height) * 100;

    let targetX = Math.min(
      100,
      Math.max(0, dragStartPosRef.current.x + pctDeltaX),
    );
    let targetY = Math.min(
      100,
      Math.max(0, dragStartPosRef.current.y + pctDeltaY),
    );

    // Direct styling modification on DOM layer for instantaneous tracking response
    overlayDOMRef.current.style.left = `${targetX}%`;
    overlayDOMRef.current.style.top = `${targetY}%`;
  };

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDraggingOverlay(false);

    if (overlayDOMRef.current) {
      const savedX = parseFloat(overlayDOMRef.current.style.left);
      const savedY = parseFloat(overlayDOMRef.current.style.top);
      if (!isNaN(savedX) && !isNaN(savedY)) {
        setOverlayPosition?.({ x: savedX, y: savedY });
      }
    }
    canvasRectRef.current = null; // Flush cache
  };

  // --- High-Performance Smooth Resize Node Operators ---
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsResizingOverlay(true);

    // Cache canvas metrics once at the beginning of resize interaction
    if (innerCanvasRef.current) {
      canvasRectRef.current = innerCanvasRef.current.getBoundingClientRect();
    }

    resizeStartSizeRef.current = overlaySize;
    dragStartCoordsRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingOverlay || !overlayDOMRef.current) return;
    e.stopPropagation();

    // Replace: const presetWidth = activePreset?.width || 1920;
    // With this:
    const presetWidth = 1920;

    const deltaX = e.clientX - dragStartCoordsRef.current.x;
    const deltaPresetPx =
      (deltaX / (previewContainerRef.current?.offsetWidth || 1)) * presetWidth;
    let newWidthPresetPx = resizeStartSizeRef.current + deltaPresetPx;

    if (newWidthPresetPx >= 50 && newWidthPresetPx <= presetWidth) {
      overlayDOMRef.current.style.width = `${(newWidthPresetPx / presetWidth) * 100}%`;
    }
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsResizingOverlay(false);

    if (overlayDOMRef.current) {
      const currentPctWidth = parseFloat(overlayDOMRef.current.style.width);

      // Replace: const presetWidth = activePreset?.width || 1920;
      // With this:
      const presetWidth = 1920;

      if (!isNaN(currentPctWidth)) {
        const finalSizePx = (currentPctWidth / 100) * presetWidth;
        setOverlaySize?.(finalSizePx);
      }
    }
    canvasRectRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "Space") {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const video = videoRef.current;
      if (video) {
        e.preventDefault();
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      }
    }
  };

  if (!file) return null;

  return (
    <>
      <div
        ref={previewContainerRef}
        role="group"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Video preview (press Space to play/pause)"
        className="relative w-full rounded-lg overflow-hidden bg-[var(--bg)] aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {isLoading && (
          <div
            className="absolute inset-0 animate-pulse bg-[var(--surface)] rounded-xl transition-opacity duration-300 z-20"
            aria-label="Loading video preview"
          />
        )}

        {/* The WYSIWYG Inner Canvas Boundary */}
        <div
          ref={innerCanvasRef}
          className="absolute inset-0 flex items-center justify-center overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black select-none touch-none"
        >
          <video
            ref={videoRef}
            controls
            onLoadedData={() => setIsLoading(false)}
            className={cn(
              "w-full h-full object-contain transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100",
            )}
            playsInline
            muted={!recipe?.keepAudio}
          >
            <track kind="captions" />
          </video>

          {/* High-Performance Smooth Rendering Image Overlay Wrapper */}
          {overlayUrl && overlayPosition && (
            <div
              ref={overlayDOMRef}
              className="group absolute select-none touch-none z-30"
              style={{
                left: `${overlayPosition?.x || 50}%`,
                top: `${overlayPosition?.y || 50}%`,
                transform: `translate(-${overlayPosition?.x || 50}%, -${overlayPosition?.y || 50}%)`, // Essential fix for visibility
                opacity: overlayOpacity / 100,
                width: `${(overlaySize / 1920) * 100}%`, // Simplified width calculation
                cursor: isDraggingOverlay ? "grabbing" : "grab",
              }}
              onPointerDown={handleOverlayPointerDown}
              onPointerMove={handleOverlayPointerMove}
              onPointerUp={handleOverlayPointerUp}
              onPointerCancel={handleOverlayPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={overlayUrl}
                className="w-full h-auto pointer-events-none select-none"
                alt="Workspace Overlay"
              />

              {/* Seamless Resize Grab Anchor */}
              <div
                className={cn(
                  "absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-[var(--accent)] rounded-full border-2 border-white cursor-nwse-resize z-50 touch-none shadow-md transition-opacity duration-200",
                  isResizingOverlay
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                )}
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
              />
            </div>
          )}
        </div>

        {/* 3x3 Grid Overlay */}
        {showGridOverlay && (
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {/* Vertical lines */}
            <div className="absolute top-0 bottom-0 left-1/3 border-l-2 border-dotted border-black" />
            <div className="absolute top-0 bottom-0 right-1/3 border-l-2 border-dotted border-black" />
            {/* Horizontal lines */}
            <div className="absolute left-0 right-0 top-1/3 border-t-2 border-dotted border-black" />
            <div className="absolute left-0 right-0 bottom-1/3 border-t-2 border-dotted border-black" />
          </div>
        )}

        {/* Draggable Text Overlays */}
        {recipe && !isLoading && containerDimensions.width > 0 && (
          <DraggableTextOverlays
            recipe={recipe}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            selectedTextId={selectedTextId ?? null}
            onSelectText={onSelectText || (() => {})}
            onUpdateText={onUpdateText || (() => {})}
          />
        )}

        {/* Toggle button */}
        {recipe && !isLoading && containerDimensions.width > 0 && (
          <DraggableTextOverlays
            recipe={recipe}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            selectedTextId={selectedTextId ?? null}
            onSelectText={onSelectText || (() => {})}
            onUpdateText={onUpdateText || (() => {})}
          />
        )}

        {/* Framing Overlay Toggle Button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${
              showOverlay
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"
            }`}
            aria-pressed={showOverlay}
            aria-label={
              showOverlay ? "Hide framing overlay" : "Show framing overlay"
            }
            title={
              showOverlay ? "Hide framing overlay" : "Show framing overlay"
            }
          >
            {showOverlay ? "Hide overlay" : "Show overlay"}
          </button>
        )}

        {/* Grid Overlay Toggle Button */}
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
            aria-label={
              showGridOverlay ? "Hide grid overlay" : "Show grid overlay"
            }
            title={showGridOverlay ? "Hide grid overlay" : "Show grid"}
          >
            {showGridOverlay ? "Hide grid" : "Show grid"}
          </button>
        )}
        {/* Compare button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={cn(
              "absolute top-2 right-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto",
              showComparison
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)]",
            )}
            aria-pressed={showComparison}
            aria-label={
              showComparison
                ? "Hide comparison preview"
                : "Show comparison preview"
            }
            title={
              showComparison
                ? "Hide comparison preview"
                : "Show comparison preview"
            }
          >
            Compare
          </button>
        )}

        {/* Grab frame button */}
        {!isLoading && (
          <button
            type="button"
            onClick={handleGrabFrame}
            className="absolute top-2 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-20 pointer-events-auto bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] flex items-center gap-1"
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
          <ComparisonPreview file={file} recipe={recipe} videoRef={videoRef} />
        </div>
      )}
    </>
  );
}
