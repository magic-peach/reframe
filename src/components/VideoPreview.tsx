"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "./components";

interface Props {
  file: File | null;
}

export default function VideoPreview({ file }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

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
    setDimensions(null);

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

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video">
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
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoadedData={() => setIsLoading(false)}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) {
            setDimensions({ width: v.videoWidth, height: v.videoHeight });
          }
        }}
        playsInline
      />

      {dimensions && (
        <div className="absolute top-3 right-3">
          <Badge label={`${dimensions.width}×${dimensions.height}`} />
        </div>
      )}
    </div>
  );
}
