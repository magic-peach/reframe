"use client";

import { useEffect, useRef, RefObject } from "react";
import { EditRecipe } from "@/lib/types";

interface Props {
  file: File | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  recipe: EditRecipe;
}

export default function VideoPreview({ file, videoRef ,recipe }: Props) {
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) return;

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    if (videoRef.current) videoRef.current.src = url;

    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [file, videoRef]);

  // sync mute state to video element
  useEffect(() => {
    if (!videoRef.current || !recipe) return;
    videoRef.current.muted = !recipe.keepAudio;
  }, [recipe, videoRef]);

  useEffect(() => {
    if (!videoRef.current || !recipe) return;
    videoRef.current.playbackRate = recipe.speed;
  }, [recipe, videoRef]);
  return (
    <div className="w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video">
     
      <video
  ref={videoRef}
  controls
  className="w-full h-full object-contain"
  playsInline
  muted={!recipe?.keepAudio}
>
  <track kind="captions" />
</video>
    </div>
  );
}