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
  const innerCanvasRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef<(() => void) | null>(null);

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
    video.addEventListener("loadedmetadata", handleLoaded); // Optimized to prevent race-condition load locks

    return () => {
      if (onLoadedRef.current) {
        video.removeEventListener("loadedmetadata", onLoadedRef.current);
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

  // --- Absolute WYSIWYG Canvas Math ---
  const activePreset = recipe
    ? recipe.preset === "custom"
      ? { width: recipe.customWidth, height: recipe.customHeight }
      : getPresetById(recipe.preset)
    : undefined;

  const containerRatio = 16 / 9;
  const outputRatio = activePreset ? activePreset.width / activePreset.height : containerRatio;

  let boxTop = 0, boxBottom = 0, boxLeft = 0, boxRight = 0;

  if (outputRatio > containerRatio) {
    const boxHeightPct = (containerRatio / outputRatio) * 100;
    const barH = (100 - boxHeightPct) / 2;
    boxTop = barH;
    boxBottom = barH;
  } else {
    const boxWidthPct = (outputRatio / containerRatio) * 100;
    const barW = (100 - boxWidthPct) / 2;
    boxLeft = barW;
    boxRight = barW;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "Space") {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      
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
          className="absolute flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out ring-1 ring-white/10 shadow-2xl bg-black select-none"
          style={{
            top: `${boxTop}%`,
            bottom: `${boxBottom}%`,
            left: `${boxLeft}%`,
            right: `${boxRight}%`,
          }}
        >
          <video
            ref={videoRef}
            controls
            onLoadedData={() => setIsLoading(false)}
            className={cn(
              "w-full h-full transition-all duration-300 ease-in-out relative z-10",
              recipe?.framing === "fill" ? "object-cover" : "object-contain",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            style={{
              transform: recipe ? `rotate(${recipe.rotate}deg)` : "none",
              filter: recipe ? `brightness(${recipe.brightness + 1}) contrast(${recipe.contrast}) saturate(${recipe.saturation})` : "none",
            }}
            playsInline
            muted={!recipe?.keepAudio}
          >
            <track kind="captions" />
          </video>

          {/* High-Performance Smooth Rendering Image Overlay Wrapper */}
          {overlayUrl && overlayPosition && (
            <div
              className="absolute select-none z-30 pointer-events-none"
              style={{
                left: `${overlayPosition.x}%`,
                top: `${overlayPosition.y}%`,
                opacity: overlayOpacity / 100,
                width: `${(overlaySize / (activePreset?.width || 1920)) * 100}%`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={overlayUrl}
                className="w-full h-auto pointer-events-none select-none"
                alt="Workspace Overlay"
              />
            </div>
          )}
        </div>

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

        {/* Compare button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={cn(
              "absolute top-2 right-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto",
              showComparison ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)]"
            )}
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