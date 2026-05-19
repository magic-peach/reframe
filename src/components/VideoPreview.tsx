"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EditRecipe } from "@/lib/types";

interface Props {
  file: File | null;
  recipe?: EditRecipe;
}

export default function VideoPreview({ file, recipe }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const onLoadedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!file) return;
    setIsLoading(true);
    const id = ++lastId.current;
    const url = URL.createObjectURL(file);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
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
  }, [file]);

  if (!file) return null;

  const flipH = recipe?.flipHorizontal ? -1 : 1;
  const flipV = recipe?.flipVertical ? -1 : 1;
  const rotateDeg = recipe?.rotate ?? 0;
  const flipStyle = {
    transform: `rotate(${rotateDeg}deg) scale(${flipH}, ${flipV})`,
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video">
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-700 rounded-xl"
          aria-label="Loading video preview"
        />
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        controls
        style={flipStyle}
        className={cn(
          "w-full h-full object-contain transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoadedData={() => setIsLoading(false)}
        playsInline
      />
    </div>
  );
}