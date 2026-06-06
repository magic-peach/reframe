"use client";

import { useRef, useState, useEffect } from "react";
import { TextOverlay, EditRecipe } from "@/lib/types";
import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe, TextOverlay, TimelineTrack, MultiTrackEditorState } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  file: File;
  recipe: EditRecipe;
  videoRef: React.RefObject<HTMLVideoElement | null> | React.MutableRefObject<HTMLVideoElement | null> | ((instance: HTMLVideoElement | null) => void);
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
interface Props {
  file: File | null;
  recipe?: EditRecipe;
  videoRef: RefObject<HTMLVideoElement | null>;
  selectedTextId?: string | null;
  onSelectText?: (id: string | null) => void;
  onUpdateText?: (id: string, updates: Partial<TextOverlay>) => void;
  // Phase 1 MVP: Multi-track support
  multiTrackState?: MultiTrackEditorState | null;
  multiTrackVideoRefs?: Record<string, RefObject<HTMLVideoElement | null>>;
}

export default function VideoPreview({
  file,
  recipe,
  videoRef,
  selectedTextId,
  onSelectText,
  onUpdateText,
}: VideoPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const overlayStartPos = useRef({ x: 0, y: 0 });

  // Generate local binary Object URL for the HTML5 Video stream wrapper
  multiTrackState,
  multiTrackVideoRefs,
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
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef<(() => void) | null>(null);
  
  // Phase 1 MVP: Multi-track URL management
  const multiTrackUrlRefs = useRef<Record<string, string | null>>({});

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
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Read framing styles dynamically based on chosen preset ratios
  const getAspectRatioClass = () => {
    switch (recipe.preset) {
      case "vertical-9-16": return "aspect-[9/16] max-h-[500px]";
      case "instagram-4-5": return "aspect-[4/5] max-h-[500px]";
      case "square-1-1": return "aspect-square max-h-[450px]";
      case "landscape-16-9": return "aspect-[16/9] max-w-full";
      default: return "aspect-video max-w-full";
    }
  };

  const handleMouseDown = (e: React.MouseEvent, overlay: TextOverlay) => {
    e.stopPropagation();
    onSelectText(overlay.id);
    setIsDragging(true);
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    overlayStartPos.current = { x: overlay.x, y: overlay.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedTextId || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const percentDeltaX = (deltaX / containerRect.width) * 100;
      const percentDeltaY = (deltaY / containerRect.height) * 100;

      const newX = Math.max(0, Math.min(90, overlayStartPos.current.x + percentDeltaX));
      const newY = Math.max(0, Math.min(95, overlayStartPos.current.y + percentDeltaY));

      onUpdateText(selectedTextId, { x: newX, y: newY });
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
      videoRef.current.play().catch(() => {});
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

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedTextId, onUpdateText]);

  return (
    <div className="w-full flex justify-center items-center bg-black/90 rounded-xl overflow-hidden p-2 border border-[var(--border)] min-h-[300px]">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div 
        ref={containerRef}
        onClick={() => onSelectText(null)}
        className={cn(
          "relative bg-zinc-900 shadow-2xl transition-all overflow-hidden group outline-none cursor-pointer",
          getAspectRatioClass()
        )}
      >
        {/* Native Browser HTML5 Streaming Canvas */}
        {videoUrl && (
          <video
            ref={videoRef as React.RefObject<HTMLVideoElement | null>} 
            src={videoUrl}
            className={cn(
              "w-full h-full pointer-events-none select-none",
              // 👇 FIXED: Changed the evaluation check to match your actual "fill" | "fit" types
              (recipe.framing ?? "fit") === "fill" ? "object-cover" : "object-contain"
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          controls
          className={cn("w-full h-full object-contain transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
          onLoadedData={() => setIsLoading(false)}
          playsInline
          muted={!recipe?.keepAudio}
        >
          <track kind="captions" />
        </video>

        {/* Phase 1 MVP: Multi-track overlay rendering */}
        {multiTrackState && multiTrackVideoRefs && multiTrackState.timelineTracks.length > 1 && (
          <div className="absolute inset-0 pointer-events-none" role="region" aria-label="Multi-track overlay layers">
            {multiTrackState.timelineTracks
              .filter((track) => track.visible && track.type === "video" && track.source && track.zIndex > 0)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((track) => {
                const videoRef = multiTrackVideoRefs[track.id];
                if (!videoRef) return null;

                return (
                  <video
                    key={track.id}
                    ref={videoRef}
                    className="absolute"
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
            style={{
              filter: `brightness(${1 + (recipe.brightness ?? 0)}) contrast(${recipe.contrast ?? 1})`,
              transform: `rotate(${recipe.rotation ?? 0}deg)`
            }}
            muted
            playsInline
            loop
            autoPlay
          />
        )}

        {/* Live Absolute Position Coordinate Text Overlay Mapping Layer */}
        {(recipe.textOverlays || []).map((overlay: TextOverlay) => (
          /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
          <div
            key={overlay.id}
            onMouseDown={(e) => handleMouseDown(e, overlay)}
            style={{
              top: `${overlay.y}%`,
              left: `${overlay.x}%`,
              color: overlay.color || "#ffffff",
              fontSize: `${overlay.fontSize || 24}px`,
              fontFamily: overlay.fontFamily || "Inter",
              transform: "translate(-50%, -50%)",
            }}
            className={cn(
              "absolute cursor-move select-none whitespace-nowrap px-2 py-1 rounded transition-shadow font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hover:bg-white/10 border border-transparent outline-none",
              selectedTextId === overlay.id && "border-blue-500 bg-black/40 ring-2 ring-blue-500/50"
            )}
          >
            {overlay.text || "Type your caption..."}
          </div>
        ))}
      </div>
    </div>
  );
}