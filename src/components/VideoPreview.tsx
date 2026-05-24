"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import { EditRecipe, SubtitleCue } from "@/lib/types";

interface Props {
  file: File | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  recipe: EditRecipe;
  subtitleCues?: SubtitleCue[];
  subtitleFontFamily?: string;
  subtitleFontSize?: "small" | "medium" | "large";
  subtitleTextColor?: string;
  subtitleBgOpacity?: number;
  subtitleHasShadow?: boolean;
}

export default function VideoPreview({
  file,
  videoRef,
  recipe,
  subtitleCues = [],
  subtitleFontFamily = "Inter",
  subtitleFontSize = "medium",
  subtitleTextColor = "#ffffff",
  subtitleBgOpacity = 0.5,
  subtitleHasShadow = true,
}: Props) {
  const urlRef = useRef<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

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

  const activeCue = subtitleCues.find(
    (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
  );

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video flex items-center justify-center">
      <video
        ref={videoRef}
        controls
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        className="w-full h-full object-contain"
        playsInline
        muted={!recipe?.keepAudio}
      >
        <track kind="captions" />
      </video>

      {/* Subtitles Overlay */}
      {activeCue && (
        <div
          className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-center select-none pointer-events-none px-4 py-1.5 rounded transition-all duration-150 max-w-[85%] whitespace-pre-wrap font-semibold z-10"
          style={{
            fontFamily: subtitleFontFamily,
            fontSize:
              subtitleFontSize === "small"
                ? "14px"
                : subtitleFontSize === "large"
                ? "28px"
                : "20px",
            color: subtitleTextColor,
            backgroundColor:
              subtitleBgOpacity > 0
                ? `rgba(0, 0, 0, ${subtitleBgOpacity})`
                : "transparent",
            textShadow: subtitleHasShadow
              ? "2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 0 rgba(0,0,0,0.5), 1px -1px 0 rgba(0,0,0,0.5), -1px 1px 0 rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.5)"
              : "none",
          }}
        >
          {activeCue.text}
        </div>
      )}
    </div>
  );
}