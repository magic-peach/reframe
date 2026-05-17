/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  file: File | null;
}

export default function VideoPreview({ file }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // stable handler reference (avoids re-attaching logic unnecessarily)
  const onLoadedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!file) return;

    setIsLoading(true);
    const id = ++lastId.current;
    const url = URL.createObjectURL(file);

    // cleanup previous object URL safely
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
    }
    urlRef.current = url;

    const video = videoRef.current;
    if (!video) return;

    video.src = url;
    video.load();

    // define handler once per effect run
    const handleLoaded = () => {
      if (lastId.current !== id) return;
      video.play().catch(() => {});
    };

    onLoadedRef.current = handleLoaded;

    video.addEventListener("loadeddata", handleLoaded);

    return () => {
      // cleanup event listener safely
      if (onLoadedRef.current) {
        video.removeEventListener("loadeddata", onLoadedRef.current);
        onLoadedRef.current = null;
      }

      // stop playback safely
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      // revoke only if still current
      if (urlRef.current === url) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file]);

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
    <div
      role="group"
      className="relative w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-film-500"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Video preview (press Space to play/pause)"
    >
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-700 rounded-xl transition-opacity duration-300"
          aria-label="Loading video preview"
        />
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        controls
        className={cn("w-full h-full object-contain transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100")}
        onLoadedData={() => setIsLoading(false)}
        playsInline
      />
    </div>
  );
}
