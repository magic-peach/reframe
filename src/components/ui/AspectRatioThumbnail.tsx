"use client";

import { cn } from "@/lib/utils";

/** Max width/height of the preview area (matches w-6 h-6 slot). */
export const THUMBNAIL_BOUNDS = 24;
const MIN_EDGE = 4;

/**
 * Scale pixel dimensions to fit inside a square box while preserving aspect ratio.
 * Uses contain-fit (same proportions as the real export size).
 */
export function getAspectRatioDimensions(
  width: number,
  height: number,
  maxSize = THUMBNAIL_BOUNDS
): { width: number; height: number; x: number; y: number } {
  if (width <= 0 || height <= 0) {
    const fallback = Math.round(maxSize * 0.65);
    const offset = (maxSize - fallback) / 2;
    return { width: fallback, height: fallback, x: offset, y: offset };
  }

  const scale = Math.min(maxSize / width, maxSize / height);
  const w = Math.max(MIN_EDGE, Math.round(width * scale));
  const h = Math.max(MIN_EDGE, Math.round(height * scale));

  return {
    width: w,
    height: h,
    x: (maxSize - w) / 2,
    y: (maxSize - h) / 2,
  };
}

interface AspectRatioThumbnailProps {
  width: number;
  height: number;
  active?: boolean;
  className?: string;
}

/**
 * Small centered aspect-ratio preview for compact preset cards.
 * Rendered as an inline SVG rect within a fixed 24×24px box.
 */
export default function AspectRatioThumbnail({
  width,
  height,
  active = false,
  className,
}: AspectRatioThumbnailProps) {
  const { width: w, height: h, x, y } = getAspectRatioDimensions(
    width,
    height
  );

  return (
    <svg
      width={THUMBNAIL_BOUNDS}
      height={THUMBNAIL_BOUNDS}
      viewBox={`0 0 ${THUMBNAIL_BOUNDS} ${THUMBNAIL_BOUNDS}`}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={1.5}
        className={cn(
          "transition-[fill,stroke,opacity] duration-150",
          active
            ? "fill-film-500/20 stroke-film-600"
            : "fill-[var(--bg)] stroke-[var(--muted)] opacity-60"
        )}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
