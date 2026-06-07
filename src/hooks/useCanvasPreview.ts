"use client";

import { RefObject, useEffect, useRef } from "react";
import { EditRecipe } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import {
  colorFilterString,
  fitContain,
  frameScale,
  rotatedSize,
  rotationRadians,
} from "@/lib/previewGeometry";

interface Params {
  /** Source `<video>` whose current frame is mirrored onto the canvas. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Target `<canvas>` the preview is drawn into. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Element used to measure the available preview area. */
  containerRef: RefObject<HTMLElement | null>;
  /** Current edit recipe (crop/rotation/colour). */
  recipe?: EditRecipe;
  /** When false the loop is torn down and no frames are drawn. */
  enabled: boolean;
}

function outputSize(recipe: EditRecipe): { width: number; height: number } | null {
  if (recipe.preset === "custom") {
    return { width: recipe.customWidth, height: recipe.customHeight };
  }
  const preset = getPresetById(recipe.preset);
  return preset ? { width: preset.width, height: preset.height } : null;
}

/**
 * Drives a single `requestAnimationFrame` loop that mirrors the source video
 * onto a canvas, applying rotation, fit/fill framing and colour adjustments so
 * the user sees crop/rotation/colour changes instantly — without an FFmpeg
 * export. The export pipeline is untouched; this is preview-only.
 *
 * Performance notes:
 * - One rAF loop per instance, started/stopped with `enabled`. No timers.
 * - The recipe is read through a ref so slider changes never re-create the loop.
 * - Container size is cached via `ResizeObserver`; layout is only read on resize,
 *   not per frame, avoiding layout thrash.
 * - Colour is applied through `ctx.filter` where supported (so letterbox bars
 *   stay pure black, matching the export's padding) and falls back to a CSS
 *   `filter` on the canvas element otherwise.
 */
export function useCanvasPreview({
  videoRef,
  canvasRef,
  containerRef,
  recipe,
  enabled,
}: Params) {
  // Latest recipe accessed by the loop without resubscribing on every change.
  const recipeRef = useRef(recipe);
  recipeRef.current = recipe;

  // Cached container measurement, refreshed only on resize.
  const sizeRef = useRef({ width: 0, height: 0 });
  // Cached `ctx.filter` support detection (null = not yet probed).
  const supportsCtxFilterRef = useRef<boolean | null>(null);
  // Last CSS filter written to the element, to skip redundant style writes.
  const cssFilterRef = useRef<string>("none");

  // Measure the container and keep it current across resizes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!enabled) {
      // Drop any element-level filter we may have applied while active.
      if (canvas && cssFilterRef.current !== "none") {
        canvas.style.filter = "none";
        cssFilterRef.current = "none";
      }
      return;
    }

    let raf = 0;

    const render = () => {
      raf = requestAnimationFrame(render);

      const video = videoRef.current;
      const canvasEl = canvasRef.current;
      const currentRecipe = recipeRef.current;
      if (!video || !canvasEl || !currentRecipe) return;
      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

      const { width: cw, height: ch } = sizeRef.current;
      if (cw <= 0 || ch <= 0) return;

      const output = outputSize(currentRecipe);
      if (!output || output.width <= 0 || output.height <= 0) return;

      // Output frame (preset aspect ratio) letterboxed inside the container.
      const display = fitContain(cw, ch, output.width, output.height);
      if (display.width <= 0 || display.height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      const bufW = Math.max(1, Math.round(display.width * dpr));
      const bufH = Math.max(1, Math.round(display.height * dpr));

      if (canvasEl.width !== bufW || canvasEl.height !== bufH) {
        canvasEl.width = bufW;
        canvasEl.height = bufH;
      }
      const cssW = `${display.width}px`;
      const cssH = `${display.height}px`;
      if (canvasEl.style.width !== cssW) canvasEl.style.width = cssW;
      if (canvasEl.style.height !== cssH) canvasEl.style.height = cssH;

      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;

      if (supportsCtxFilterRef.current === null) {
        supportsCtxFilterRef.current = typeof ctx.filter === "string";
      }

      const filter = colorFilterString(
        currentRecipe.brightness,
        currentRecipe.contrast,
        currentRecipe.saturation
      );

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
      ctx.clearRect(0, 0, bufW, bufH);
      // Black backdrop = letterbox pad (fit) / crop matte (fill), like the export.
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, bufW, bufH);

      // Apply colour to the video pixels only.
      if (supportsCtxFilterRef.current) {
        ctx.filter = filter;
        if (cssFilterRef.current !== "none") {
          canvasEl.style.filter = "none";
          cssFilterRef.current = "none";
        }
      } else if (cssFilterRef.current !== filter) {
        // Fallback: filter the whole element (also tints letterbox bars).
        canvasEl.style.filter = filter;
        cssFilterRef.current = filter;
      }

      const rotated = rotatedSize(
        video.videoWidth,
        video.videoHeight,
        currentRecipe.rotate
      );
      const scale = frameScale(
        rotated.width,
        rotated.height,
        bufW,
        bufH,
        currentRecipe.framing
      );

      ctx.translate(bufW / 2, bufH / 2);
      if (currentRecipe.rotate !== 0) {
        ctx.rotate(rotationRadians(currentRecipe.rotate));
      }
      const drawW = video.videoWidth * scale;
      const drawH = video.videoHeight * scale;
      // Draw the un-rotated frame centred; the canvas transform handles rotation
      // and anything past the buffer edges is clipped automatically (fill crop).
      ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [enabled, videoRef, canvasRef]);
}
