"use client";

import type { EditRecipe } from "@/lib/types";
import { useEffect, useRef } from "react";

interface Props {
  file: File | null;
  keepAudio: boolean;
  speed: number;
  onRecipePatch: (patch: Partial<EditRecipe>) => void;
}

export default function VideoPreview({
  file,
  keepAudio,
  speed,
  onRecipePatch,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) return;

    // revoke previous object url to avoid memory leaks
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    if (videoRef.current) videoRef.current.src = url;

    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [file]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !file) return;
    v.muted = !keepAudio;
    v.playbackRate = speed;
  }, [file, keepAudio, speed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !file) return;

    const onVolumeChange = () => {
      const el = videoRef.current;
      if (!el) return;
      const nextKeepAudio = !el.muted;
      if (nextKeepAudio !== keepAudio) {
        onRecipePatch({ keepAudio: nextKeepAudio });
      }
    };

    v.addEventListener("volumechange", onVolumeChange);
    return () => v.removeEventListener("volumechange", onVolumeChange);
  }, [file, keepAudio, onRecipePatch]);

  if (!file) return null;

  return (
    <div className="w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain"
        playsInline
      />
    </div>
  );
}
