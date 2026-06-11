/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe, TextOverlay, MultiTrackEditorState } from "@/lib/types";
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
  // Phase 1 MVP: Multi-track support
  multiTrackState?: MultiTrackEditorState | null;
  multiTrackVideoRefs?: Record<string, RefObject<HTMLVideoElement | null>>;
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
  multiTrackState,
  multiTrackVideoRefs,
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

  // Phase 1 MVP: Multi-track URL management
  const multiTrackUrlRefs = useRef<Record<string, string | null>>({});

  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Listen to video media updates to safely drive the custom timeline bar on the client side
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [file, videoRef]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "00:00";
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

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
      video.play().catch(() => { });
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

  // Phase 1 MVP: Setup multi-track video sources
  useEffect(() => {
    if (!multiTrackState || !multiTrackVideoRefs) return;

    multiTrackState.timelineTracks.forEach((track) => {
      if (track.type !== "video" || !track.source) return;

      const videoRef = multiTrackVideoRefs[track.id];
      if (!videoRef?.current) return;

      // Cleanup old URL
      if (multiTrackUrlRefs.current[track.id]) {
        URL.revokeObjectURL(multiTrackUrlRefs.current[track.id]!);
      }

      // Create new URL and load
      const url = URL.createObjectURL(track.source);
      multiTrackUrlRefs.current[track.id] = url;
      videoRef.current.src = url;
      videoRef.current.load();

      // Auto-play for preview
      videoRef.current.play().catch(() => { });
    });

    return () => {
      // Cleanup URLs on unmount
      Object.values(multiTrackUrlRefs.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      multiTrackUrlRefs.current = {};
    };
  }, [multiTrackState, multiTrackVideoRefs]);

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
  const outputRatio = activePreset
    ? activePreset.width / activePreset.height
    : containerRatio;

  let boxTop = 0,
    boxBottom = 0,
    boxLeft = 0,
    boxRight = 0;

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
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const video = videoRef.current;
      if (video) {
        e.preventDefault();
        if (video.paused) video.play().catch(() => { });
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

        {/* THE WYSIWYG Inner Canvas Boundary */}
        <div
          ref={innerCanvasRef}
          className="absolute flex items-center justify-center overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black select-none"
          style={{
            top: `${boxTop}%`,
            bottom: `${boxBottom}%`,
            left: `${boxLeft}%`,
            right: `${boxRight}%`,
          }}
        >
          {/* THE VIDEO WITH NATIVE CONTROLS RESTORED */}
          <video
            ref={videoRef}
            controls
            onLoadedData={() => setIsLoading(false)}
            className={cn(
              "w-full h-full transition-opacity duration-300",
              recipe?.framing === "fill" ? "object-cover" : "object-contain",
              isLoading ? "opacity-0" : "opacity-100",
            )}
            style={{
              transform: recipe ? `rotate(${recipe.rotate}deg)` : "none",
              filter: recipe
                ? `brightness(${recipe.brightness + 1}) contrast(${recipe.contrast}) saturate(${recipe.saturation})`
                : "none",
            }}
            playsInline
            muted={!recipe?.keepAudio}
          >
            <track kind="captions" />
          </video>

          {/* Phase 1 MVP: Multi-track overlay rendering (Contained within WYSIWYG bounds) */}
          {multiTrackState && multiTrackVideoRefs && multiTrackState.timelineTracks.length > 1 && (
            <div className="absolute inset-0 pointer-events-none" role="region" aria-label="Multi-track overlay layers">
              {multiTrackState.timelineTracks
                .filter((track) => track.visible && track.type === "video" && track.source && track.zIndex > 0)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((track) => {
                  const trackVideoRef = multiTrackVideoRefs[track.id];
                  if (!trackVideoRef) return null;

                  return (
                    <video
                      key={track.id}
                      ref={trackVideoRef}
                      className="absolute pointer-events-auto"
                      style={{
                        left: track.position.x === -1 ? "50%" : `${track.position.x}px`,
                        top: track.position.y === -1 ? "50%" : `${track.position.y}px`,
                        width: `${track.scale * 100}%`,
                        height: "auto",
                        opacity: track.opacity / 100,
                        transform:
                          track.position.x === -1 && track.position.y === -1
                            ? "translate(-50%, -50%)"
                            : "none",
                        zIndex: track.zIndex,
                      }}
                      muted
                      playsInline
                    >
                      <track kind="captions" />
                    </video>
                  );
                })}
            </div>
          )}
        </div>

        {/* Letterbox / Crop preview overlays derived from layout calculations */}
        {showOverlay && recipe && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {recipe.framing === "fit" ? (
              <>
                <div className="absolute left-0 right-0 top-0 bg-black/60" style={{ height: `${boxTop}%` }} />
                <div className="absolute left-0 right-0 bottom-0 bg-black/60" style={{ height: `${boxBottom}%` }} />
                <div className="absolute top-0 bottom-0 left-0 bg-black/60" style={{ width: `${boxLeft}%` }} />
                <div className="absolute top-0 bottom-0 right-0 bg-black/60" style={{ width: `${boxRight}%` }} />
              </>
            ) : (
              <>
                <div className="absolute left-0 right-0 top-0 bg-black/40" style={{ height: `${boxTop}%` }} />
                <div className="absolute left-0 right-0 bottom-0 bg-black/40" style={{ height: `${boxBottom}%` }} />
                <div className="absolute top-0 bottom-0 left-0 bg-black/40" style={{ width: `${boxLeft}%` }} />
                <div className="absolute top-0 bottom-0 right-0 bg-black/40" style={{ width: `${boxRight}%` }} />
                <div
                  className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
                  style={{
                    top: `${boxTop}%`,
                    bottom: `${boxBottom}%`,
                    left: `${boxLeft}%`,
                    right: `${boxRight}%`,
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
        {recipe && !isLoading && containerDimensions.width > 0 && (
          <DraggableTextOverlays
            recipe={recipe}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            selectedTextId={selectedTextId ?? null}
            onSelectText={onSelectText || (() => { })}
            onUpdateText={onUpdateText || (() => { })}
          />
        )}

        {/* Framing Overlay Toggle Button */}
        {recipe && !isLoading && (
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

        {/* Grid Overlay Toggle Button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowGridOverlay((v) => !v)}
            className={`absolute top-2 left-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${showGridOverlay
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"
              }`}
            aria-pressed={showGridOverlay}
            aria-label={showGridOverlay ? "Hide grid overlay" : "Show grid overlay"}
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