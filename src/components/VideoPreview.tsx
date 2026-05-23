"use client";

import { useEffect, useRef, RefObject } from "react";
import { EditRecipe } from "@/lib/types";
import { getPresetById } from "@/lib/presets";

interface Props {
  file: File | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  recipe: EditRecipe;
}

export default function VideoPreview({ file, videoRef, recipe }: Props) {
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

  // Calculate aspect ratio overlay dimensions
  const getOverlayStyles = () => {
    if (!file || !recipe.preset || recipe.preset === "custom") return null;

    const preset = getPresetById(recipe.preset);
    if (!preset) return null;

    const targetAspect = preset.width / preset.height;
    const previewAspect = 16 / 9; // Fixed aspect ratio of preview container

    if (recipe.framing === "fill") {
      // FILL mode: show dashed box where content will be cropped
      if (targetAspect > previewAspect) {
        // Target is wider: crop top/bottom
        const scaleFactor = targetAspect / previewAspect;
        const visibleHeightPercent = (1 / scaleFactor) * 100;
        const topPercent = (100 - visibleHeightPercent) / 2;
        return {
          type: "fill",
          style: {
            top: `${topPercent}%`,
            left: 0,
            width: "100%",
            height: `${visibleHeightPercent}%`,
          },
        };
      } else if (targetAspect < previewAspect) {
        // Target is narrower: crop left/right
        const scaleFactor = previewAspect / targetAspect;
        const visibleWidthPercent = (1 / scaleFactor) * 100;
        const leftPercent = (100 - visibleWidthPercent) / 2;
        return {
          type: "fill",
          style: {
            top: 0,
            left: `${leftPercent}%`,
            width: `${visibleWidthPercent}%`,
            height: "100%",
          },
        };
      }
      // Target aspect matches preview aspect: no overlay needed
      return null;
    } else {
      // FIT mode: show letterbox/pillarbox bars
      if (targetAspect > previewAspect) {
        // Target is wider (e.g., 47:10 vs 16:9): add letterbox (top/bottom bars)
        const scaleFactor = targetAspect / previewAspect;
        const barHeightPercent = ((scaleFactor - 1) / (2 * scaleFactor)) * 100;
        return {
          type: "fit",
          bars: [
            { position: "top", sizePercent: barHeightPercent },
            { position: "bottom", sizePercent: barHeightPercent },
          ],
        };
      } else if (targetAspect < previewAspect) {
        // Target is narrower (e.g., 9:16 vs 16:9): add pillarbox (left/right bars)
        const scaleFactor = previewAspect / targetAspect;
        const barWidthPercent = ((scaleFactor - 1) / (2 * scaleFactor)) * 100;
        return {
          type: "fit",
          bars: [
            { position: "left", sizePercent: barWidthPercent },
            { position: "right", sizePercent: barWidthPercent },
          ],
        };
      }
      // Target aspect matches preview aspect: no overlay needed
      return null;
    }
  };

  const overlayInfo = getOverlayStyles();

  return (
    <div className="w-full rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video relative">
      <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain"
        playsInline
        muted={!recipe?.keepAudio}
      >
        <track kind="captions" />
      </video>

      {/* Aspect ratio preview overlay */}
      {overlayInfo && (
        <div className="absolute inset-0 pointer-events-none">
          {overlayInfo.type === "fill" && (
            <div
              className="absolute border-2 border-dashed border-amber-400 opacity-60"
              style={overlayInfo.style}
            />
          )}
          {overlayInfo.type === "fit" &&
            overlayInfo.bars?.map((bar, idx) => (
              <div
                key={idx}
                className="absolute bg-black opacity-40"
                style={
                  bar.position === "top"
                    ? {
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${bar.sizePercent}%`,
                      }
                    : bar.position === "bottom"
                    ? {
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        height: `${bar.sizePercent}%`,
                      }
                    : bar.position === "left"
                    ? {
                        top: 0,
                        left: 0,
                        width: `${bar.sizePercent}%`,
                        height: "100%",
                      }
                    : {
                        top: 0,
                        right: 0,
                        width: `${bar.sizePercent}%`,
                        height: "100%",
                      }
                }
              />
            ))}
        </div>
      )}
    </div>
  );
}