"use client";

import { useEffect, useRef } from "react";

interface Props {
  file: File | null;
}

export default function VideoPreview({ file }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) return;

    // Revoke the previous object URL to avoid memory leaks
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);

    const url = URL.createObjectURL(file);
    urlRef.current = url;

    if (videoRef.current) {
      videoRef.current.src = url;
    }

    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [file]);

  if (!file) return null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video">
      <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain"
        playsInline
      />
    </div>
  );
}
