"use client";

import { useRef, useState, useEffect } from "react";
import { TextOverlay, EditRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  file: File;
  recipe: EditRecipe;
  videoRef: React.RefObject<HTMLVideoElement | null> | React.MutableRefObject<HTMLVideoElement | null> | ((instance: HTMLVideoElement | null) => void);
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
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