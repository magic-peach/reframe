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
}

export default function VideoPreview({
  file,
  recipe,
  videoRef,
  selectedTextId = null,
  onSelectText,
  onUpdateText,
}: Props) {
  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const outputFrameRef = useRef<HTMLDivElement>(null);
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

  /**
   * Track output frame dimensions for accurate text overlay positioning.
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (outputFrameRef.current) {
        const rect = outputFrameRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Need to observe the element directly in case layout changes without window resize
    const observer = new ResizeObserver(updateDimensions);
    if (outputFrameRef.current) {
      observer.observe(outputFrameRef.current);
    }
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [recipe?.preset, recipe?.customWidth, recipe?.customHeight, recipe?.framing]);

  const preset = recipe?.preset === "custom"
    ? { width: recipe.customWidth, height: recipe.customHeight }
    : recipe ? getPresetById(recipe.preset) : null;
  
  const outputRatio = preset ? preset.width / preset.height : 16 / 9;

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
        role="group"
        className="relative w-full rounded-lg overflow-hidden bg-[var(--bg)] aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] flex items-center justify-center"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Video preview (press Space to play/pause)"
      >
        {isLoading && (
          <div
            className="absolute inset-0 animate-pulse bg-[var(--surface)] transition-opacity duration-300"
            aria-label="Loading video preview"
          />
        )}
        
        {/* Output Frame Wrapper */}
        {recipe && (
          <div 
            ref={outputFrameRef}
            className={cn("relative flex items-center justify-center transition-all duration-300 bg-black", isLoading ? "opacity-0" : "opacity-100")}
            style={{
              aspectRatio: `${outputRatio}`,
              width: outputRatio > (16 / 9) ? '100%' : 'auto',
              height: outputRatio <= (16 / 9) ? '100%' : 'auto',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              controls
              className="w-full h-full"
              style={{ objectFit: recipe.framing === "fit" ? "contain" : "cover" }}
              onLoadedData={() => setIsLoading(false)}
              playsInline
              muted={!recipe?.keepAudio}
            >
              <track kind="captions" />
            </video>

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
          </div>
        )}



        {/* Compare button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={`absolute top-2 right-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${
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
            className="absolute top-2 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)] flex items-center gap-1"
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
