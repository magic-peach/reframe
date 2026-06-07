/**
 * Pure geometry + color helpers shared by the canvas live preview
 * (`useCanvasPreview`). These mirror the transformations the FFmpeg export
 * pipeline applies in `buildVideoFilter` — rotation (transpose) → fit/fill
 * scale + pad/crop → eq colour — so the preview reflects the final output
 * without running an export.
 *
 * Everything here is framework-agnostic and side-effect free so it can be
 * unit tested in isolation.
 */

export type Rotation = 0 | 90 | 180 | 270;

export type Framing = "fit" | "fill";

export interface Size {
  width: number;
  height: number;
}

/**
 * Source dimensions after applying a 90/270° rotation (which swaps the axes).
 * 0/180° leave the dimensions unchanged.
 */
export function rotatedSize(width: number, height: number, rotate: Rotation): Size {
  return rotate === 90 || rotate === 270
    ? { width: height, height: width }
    : { width, height };
}

/** Rotation in radians, clockwise — matches FFmpeg `transpose` orientation. */
export function rotationRadians(rotate: Rotation): number {
  return (rotate * Math.PI) / 180;
}

/**
 * Largest rectangle with aspect ratio `arW:arH` that fits entirely inside a
 * `containerW × containerH` box (CSS `object-fit: contain`). Used to letterbox
 * the output frame — whose aspect ratio is the selected preset — inside the
 * fixed 16:9 preview container.
 */
export function fitContain(
  containerW: number,
  containerH: number,
  arW: number,
  arH: number
): Size {
  if (arW <= 0 || arH <= 0 || containerW <= 0 || containerH <= 0) {
    return { width: 0, height: 0 };
  }
  const targetAr = arW / arH;
  const containerAr = containerW / containerH;
  if (targetAr > containerAr) {
    // Wider than the container → full width, pillarbox top/bottom.
    return { width: containerW, height: containerW / targetAr };
  }
  // Taller than the container → full height, letterbox left/right.
  return { width: containerH * targetAr, height: containerH };
}

/**
 * Scale factor for drawing a `srcW × srcH` frame into an `outW × outH` output
 * region. `fit` shrinks the frame so it is fully visible (letterbox bars);
 * `fill` enlarges it so it covers the region (cropping the overflow). Mirrors
 * FFmpeg's `force_original_aspect_ratio=decrease`+`pad` vs `increase`+`crop`.
 */
export function frameScale(
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
  framing: Framing
): number {
  if (srcW <= 0 || srcH <= 0) return 0;
  const sx = outW / srcW;
  const sy = outH / srcH;
  return framing === "fit" ? Math.min(sx, sy) : Math.max(sx, sy);
}

/**
 * CSS/canvas `filter` string approximating FFmpeg's `eq` colour adjustments.
 * Returns `"none"` when every channel is at its default so callers can skip
 * compositing work.
 *
 * Mapping: FFmpeg `brightness` is additive in [-1, 1]; CSS `brightness()` is a
 * multiplier centred on 1, so we map `b → 1 + b`. `contrast` and `saturation`
 * are already multipliers centred on 1 in both systems and pass through 1:1.
 */
export function colorFilterString(
  brightness: number,
  contrast: number,
  saturation: number
): string {
  const parts: string[] = [];
  if (brightness !== 0) parts.push(`brightness(${(1 + brightness).toFixed(3)})`);
  if (contrast !== 1) parts.push(`contrast(${contrast.toFixed(3)})`);
  if (saturation !== 1) parts.push(`saturate(${saturation.toFixed(3)})`);
  return parts.length > 0 ? parts.join(" ") : "none";
}
