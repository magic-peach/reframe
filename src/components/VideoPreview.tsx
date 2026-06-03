/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo, RefObject } from "react";
import Image from "next/image";
import { EditRecipe, TextOverlay, OverlayPosition } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";
import { Camera, Play, Pause, Volume2, VolumeX } from "lucide-react";
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
  overlayPosition?: OverlayPosition;
  overlaySize?: number;
  overlayOpacity?: number;
}

export default function VideoPreview({
  file,
  recipe,
  videoRef,
  selectedTextId = null,
  onSelectText,
  onUpdateText,
  overlayFile,
  overlayPosition = "bottom-right",
  overlaySize = 150,
  overlayOpacity = 100,
}: Props) {
  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(!recipe?.keepAudio);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [overlayNaturalSize, setOverlayNaturalSize] = useState({ width: 1, height: 1 });
  const adjustmentFilter = useMemo(() => {
    const brightness = 1 + (recipe?.brightness ?? 0);
    const contrast = recipe?.contrast ?? 1;
    const saturation = recipe?.saturation ?? 1;

    return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
  }, [recipe?.brightness, recipe?.contrast, recipe?.saturation]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [videoRef]);

  useEffect(() => {
    if (!overlayFile) {
      setOverlayUrl(null);
      setOverlayNaturalSize({ width: 1, height: 1 });
      return;
    }
    const url = URL.createObjectURL(overlayFile);
    setOverlayUrl(url);
    setOverlayNaturalSize({ width: 1, height: 1 });
    return () => URL.revokeObjectURL(url);
  }, [overlayFile]);
  
  useEffect(() => {
    setIsMuted(!recipe?.keepAudio);
  }, [recipe?.keepAudio]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [videoRef]);

  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef<(() => void) | null>(null);

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

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !recipe) return;

    const handleTimeUpdate = () => {
      // If duration is not yet available, fallback to a safe large number to prevent immediate stops
      const start = recipe.trimStart || 0;
      const end = recipe.trimEnd !== null ? recipe.trimEnd : (video.duration || Infinity);

      if (video.currentTime < start) {
        video.currentTime = start;
      } else if (video.currentTime >= end && end > 0) {
        video.pause();
        video.currentTime = start;
      }
      
      setCurrentTime(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [recipe, videoRef]);

  const preset = recipe?.preset === "custom"
    ? { width: recipe.customWidth, height: recipe.customHeight }
    : recipe ? getPresetById(recipe.preset) : null;

  const isRotated = recipe?.rotate === 90 || recipe?.rotate === 270;
  
  const targetW = preset ? preset.width : 16;
  const targetH = preset ? preset.height : 9;

  const targetRatio = targetW / targetH;
  
  const scale = containerDimensions.width > 0 ? containerDimensions.width / targetW : 1;
  const previewOverlaySize = overlaySize * scale;
  const previewPadding = 20 * scale;

  const overlay = (() => {
    if (!recipe || !showOverlay || !preset) return null;

    // Both containerRatio and outputRatio must use the same rotation-aware
    // dimensions so the bar math stays consistent regardless of rotation.
    const containerRatio = targetRatio;   // targetW / targetH, already swapped for 90°/270°
    const outputRatio = targetW / targetH; // identical to containerRatio — bars are zero when output fits exactly

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

  if (!file) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "Space") {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "BUTTON" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const video = videoRef.current;
      if (video) {
        e.preventDefault(); // Prevent default page scroll
        togglePlayback();
      }
    }
  };

  return (
    <>
      <div
        ref={previewContainerRef}
        role="group"
        className="relative w-full mx-auto rounded-lg overflow-hidden bg-[var(--bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all duration-300 group"
        style={{ aspectRatio: targetRatio, maxWidth: `calc(65vh * ${targetRatio})` }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Video preview (press Space to play/pause)"
      >
        {isLoading && (
          <div
            className="absolute inset-0 animate-pulse bg-[var(--surface)] rounded-xl transition-opacity duration-300 z-10"
            aria-label="Loading video preview"
          />
        )}
        
        {/* 1. ROTATED VIDEO LAYER */}
        <div 
          className="absolute top-1/2 left-1/2 flex items-center justify-center pointer-events-none z-0" 
          style={{ 
            width: isRotated ? (containerDimensions.height || '100%') : '100%',
            height: isRotated ? (containerDimensions.width || '100%') : '100%',
            transform: `translate(-50%, -50%) rotate(${recipe?.rotate || 0}deg)` 
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            className={cn("w-full h-full object-contain transition-all duration-300", isLoading ? "opacity-0" : "opacity-100")}
            style={{ filter: adjustmentFilter }}
            onLoadedData={() => setIsLoading(false)}
            playsInline
            muted={isMuted}
          >
            <track kind="captions" />
          </video>
        </div>

        {/* CLICK-TO-PLAY LAYER */}
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0"
          onClick={togglePlayback}
          aria-label="Play/Pause Video"
        />

        {/* 2. FIXED UI LAYER */}
        <div className={cn("absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-3 z-40 transition-opacity duration-300", isPlaying ? "opacity-0 group-hover:opacity-100 focus-within:opacity-100" : "opacity-100")}>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayback();
            }}
            className="text-white hover:text-[var(--accent)] transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <input 
            type="range"
            min={0}
            max={videoRef.current?.duration || 100}
            step="0.01"
            value={currentTime}
            onChange={(e) => {
              if (videoRef.current) {
                videoRef.current.currentTime = Number(e.target.value);
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 accent-[var(--accent)] h-1 cursor-pointer"
            aria-label="Timeline"
          />
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
              }
            }}
            className="text-white hover:text-[var(--accent)] transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Letterbox / Crop overlay */}
        {overlay && (
          <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
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
          <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
            {/* Vertical lines */}
            <div className="absolute top-0 bottom-0 left-1/3 border-l-2 border-dotted border-black" />
            <div className="absolute top-0 bottom-0 right-1/3 border-l-2 border-dotted border-black" />
            {/* Horizontal lines */}
            <div className="absolute left-0 right-0 top-1/3 border-t-2 border-dotted border-black" />
            <div className="absolute left-0 right-0 bottom-1/3 border-t-2 border-dotted border-black" />
          </div>
        )}

        {/* IMAGE OVERLAY LAYER */}
        {overlayUrl && containerDimensions.width > 0 && (
          <Image
            src={overlayUrl}
            alt="Overlay"
            width={overlayNaturalSize.width}
            height={overlayNaturalSize.height}
            unoptimized
            className="absolute pointer-events-none z-30 h-auto"
            onLoad={(event) => {
              const img = event.currentTarget;
              setOverlayNaturalSize({
                width: img.naturalWidth || 1,
                height: img.naturalHeight || 1,
              });
            }}
            style={{
              width: previewOverlaySize,
              opacity: overlayOpacity / 100,
              ...(overlayPosition === "top-left" ? { top: previewPadding, left: previewPadding } : {}),
              ...(overlayPosition === "top-right" ? { top: previewPadding, right: previewPadding } : {}),
              ...(overlayPosition === "bottom-left" ? { bottom: previewPadding, left: previewPadding } : {}),
              ...(overlayPosition === "bottom-right" ? { bottom: previewPadding, right: previewPadding } : {}),
            }}
          />
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
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-40 pointer-events-auto ${
              showOverlay
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

        {/* Grid overlay button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowGridOverlay((v) => !v)}
            className={`absolute top-2 left-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-40 pointer-events-auto ${
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
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={`absolute top-2 right-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-40 pointer-events-auto ${
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
            onClick={handleGrabFrame}
            className="absolute top-2 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-40 pointer-events-auto bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)] flex items-center gap-1"
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
