/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
"use client";

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { EditRecipe, TextOverlay } from "@/lib/types";
import { getPresetById } from "@/lib/presets";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import ComparisonPreview from "./ComparisonPreview";
import DraggableTextOverlays from "./DraggableTextOverlays";
import { PREVIEW_CONTAINER_ASPECT, clampCropBox, getCenteredMaxCropBox } from "@/lib/crop-frame";

interface Props {
  file: File | null;
  recipe?: EditRecipe;
  videoRef: RefObject<HTMLVideoElement | null>;
  selectedTextId?: string | null;
  onSelectText?: (id: string | null) => void;
  onUpdateText?: (id: string, updates: Partial<TextOverlay>) => void;
  onCropChange?: (patch: Partial<EditRecipe>) => void;
}

export default function VideoPreview({
  file,
  recipe,
  videoRef,
  selectedTextId = null,
  onSelectText,
  onUpdateText,
  onCropChange,
}: Props) {
  const lastId = useRef(0);
  const urlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef<(() => void) | null>(null);

  const cropBoxFromRecipe = recipe
    ? {
        x: recipe.cropBoxX,
        y: recipe.cropBoxY,
        w: recipe.cropBoxW,
        h: recipe.cropBoxH,
      }
    : null;

  const [draftCropBox, setDraftCropBox] = useState(() => ({
    x: cropBoxFromRecipe?.x ?? 0.2,
    y: cropBoxFromRecipe?.y ?? 0.2,
    w: cropBoxFromRecipe?.w ?? 0.6,
    h: cropBoxFromRecipe?.h ?? 0.6,
  }));
  const [isEditingCrop, setIsEditingCrop] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    if (isEditingCrop) return;
    setDraftCropBox({
      x: recipe.cropBoxX,
      y: recipe.cropBoxY,
      w: recipe.cropBoxW,
      h: recipe.cropBoxH,
    });
  }, [recipe, isEditingCrop]);

  const outputAspectRatio = (() => {
    if (!recipe) return null;
    const preset =
      recipe.preset === "custom"
        ? { width: recipe.customWidth, height: recipe.customHeight }
        : getPresetById(recipe.preset);
    if (!preset) return null;
    return preset.width / preset.height;
  })();

  const cropAspectK = outputAspectRatio ? outputAspectRatio / PREVIEW_CONTAINER_ASPECT : null;

  // Use `draftCropBox` as the source of truth while dragging/resizing for flicker-free UI.
  const currentCropBox = cropBoxFromRecipe ? draftCropBox : null;

  const cropPreviewTransform = (() => {
    if (!recipe || recipe.framing !== "fill") return null;
    if (!showOverlay) return null;
    if (!currentCropBox) return null;
    if (!containerDimensions.width || !containerDimensions.height) return null;

    const boxLeftPx = currentCropBox.x * containerDimensions.width;
    const boxTopPx = currentCropBox.y * containerDimensions.height;
    const boxWpx = currentCropBox.w * containerDimensions.width;
    const zoom = boxWpx > 0 ? containerDimensions.width / boxWpx : 1;
    if (!isFinite(zoom) || zoom <= 0) return null;

    // Keep the crop box positioned where it is, while magnifying the video inside it.
    // We want: x' = x*zoom + tx with x'=boxLeft and x=boxLeft -> tx = boxLeft*(1-zoom)
    // Implemented as: scale(zoom) translate(tx/zoom).
    const tx = boxLeftPx * (1 / zoom - 1);
    const ty = boxTopPx * (1 / zoom - 1);

    return {
      transformOrigin: "top left",
      transform: `scale(${zoom}) translate(${tx}px, ${ty}px)`,
      willChange: "transform",
    } as React.CSSProperties;
  })();

  type ResizeHandle = "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";
  const interactionRef = useRef<{
    handle: ResizeHandle;
    pointerId: number | null;
    startPointerX: number;
    startPointerY: number;
    startBox: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const startEdit = (handle: ResizeHandle, e: React.PointerEvent) => {
    if (!recipe || recipe.framing !== "fill") return;
    if (!containerDimensions.width || !containerDimensions.height) return;
    if (!cropAspectK) return;
    if (e.pointerType !== "mouse" && e.pointerType !== "touch" && e.pointerType !== "pen") return;

    const box = cropBoxFromRecipe
      ? { x: cropBoxFromRecipe.x, y: cropBoxFromRecipe.y, w: cropBoxFromRecipe.w, h: cropBoxFromRecipe.h }
      : { x: draftCropBox.x, y: draftCropBox.y, w: draftCropBox.w, h: draftCropBox.h };

    interactionRef.current = {
      handle,
      pointerId: e.pointerId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startBox: box,
    };
    latestPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
    setDraftCropBox(box);
    setIsEditingCrop(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const clampToBounds = (box: { x: number; y: number; w: number; h: number }) => {
    const snapPx = 8;
    const snapTolX = containerDimensions.width ? snapPx / containerDimensions.width : 0;
    const snapTolY = containerDimensions.height ? snapPx / containerDimensions.height : 0;

    const w = Math.min(1, Math.max(0.0001, box.w));
    const h = Math.min(1, Math.max(0.0001, box.h));
    let x = Math.min(Math.max(0, box.x), 1 - w);
    let y = Math.min(Math.max(0, box.y), 1 - h);

    // Snap to edges when close.
    const xMax = 1 - w;
    const yMax = 1 - h;
    if (Math.abs(x - 0) <= snapTolX) x = 0;
    if (Math.abs(x - xMax) <= snapTolX) x = xMax;
    if (Math.abs(y - 0) <= snapTolY) y = 0;
    if (Math.abs(y - yMax) <= snapTolY) y = yMax;

    // Extra safety.
    return clampCropBox({ x, y, w, h }, 0.04, 0.04);
  };

  const computeDraftFromPointer = (clientX: number, clientY: number) => {
    const i = interactionRef.current;
    if (!i) return draftCropBox;
    if (!containerDimensions.width || !containerDimensions.height) return draftCropBox;
    if (!cropAspectK) return draftCropBox;

    const dxNorm = (clientX - i.startPointerX) / containerDimensions.width;
    const dyNorm = (clientY - i.startPointerY) / containerDimensions.height;

    const minBoxPx = 24;
    const minW = minBoxPx / containerDimensions.width;
    const minH = minBoxPx / containerDimensions.height;
    const minWAspect = minH * cropAspectK; // w = h * k

    const k = cropAspectK; // w/h = k

    const start = i.startBox;
    const startLeft = start.x;
    const startRight = start.x + start.w;
    const startTop = start.y;
    const startBottom = start.y + start.h;
    const startCenterX = startLeft + start.w / 2;
    const startCenterY = startTop + start.h / 2;

    let next = { ...start };

    const clampSize = (w: number, h: number) => {
      let ww = Math.max(minWAspect, Math.min(1, w));
      let hh = ww / k;
      // Ensure minimum height too.
      if (hh < minH) {
        hh = Math.max(minH, hh);
        ww = hh * k;
      }
      return { w: ww, h: hh };
    };

    switch (i.handle) {
      case "move": {
        next.x = start.x + dxNorm;
        next.y = start.y + dyNorm;
        next = clampToBounds(next);
        return next;
      }
      case "w": {
        // Right edge fixed, vertical center preserved.
        const right = startRight;
        const newLeft = startLeft + dxNorm;
        const { w, h } = clampSize(right - newLeft, 1);
        next.w = w;
        next.h = h;
        next.x = right - w;
        next.y = startCenterY - h / 2;
        next = clampToBounds(next);
        return next;
      }
      case "e": {
        // Left edge fixed, vertical center preserved.
        const left = startLeft;
        const newRight = startRight + dxNorm;
        const { w, h } = clampSize(newRight - left, 1);
        next.w = w;
        next.h = h;
        next.x = left;
        next.y = startCenterY - h / 2;
        next = clampToBounds(next);
        return next;
      }
      case "n": {
        // Bottom edge fixed, horizontal center preserved.
        const bottom = startBottom;
        const newTop = startTop + dyNorm;
        const newH = bottom - newTop;
        const hh = Math.max(minH, newH);
        const ww = hh * k;
        next.w = ww;
        next.h = hh;
        next.y = bottom - hh;
        next.x = startCenterX - ww / 2;
        next = clampToBounds(next);
        return next;
      }
      case "s": {
        // Top edge fixed, horizontal center preserved.
        const top = startTop;
        const newBottom = startBottom + dyNorm;
        const newH = newBottom - top;
        const hh = Math.max(minH, newH);
        const ww = hh * k;
        next.w = ww;
        next.h = hh;
        next.y = top;
        next.x = startCenterX - ww / 2;
        next = clampToBounds(next);
        return next;
      }
      case "nw": {
        // Bottom-right fixed.
        const bottom = startBottom;
        const right = startRight;
        const newLeft = startLeft + dxNorm;
        const { w, h } = clampSize(right - newLeft, 1);
        next.w = w;
        next.h = h;
        next.x = right - w;
        next.y = bottom - h;
        next = clampToBounds(next);
        return next;
      }
      case "ne": {
        // Bottom-left fixed.
        const bottom = startBottom;
        const left = startLeft;
        const newRight = startRight + dxNorm;
        const { w, h } = clampSize(newRight - left, 1);
        next.w = w;
        next.h = h;
        next.x = left;
        next.y = bottom - h;
        next = clampToBounds(next);
        return next;
      }
      case "sw": {
        // Top-right fixed.
        const top = startTop;
        const right = startRight;
        const newLeft = startLeft + dxNorm;
        const { w, h } = clampSize(right - newLeft, 1);
        next.w = w;
        next.h = h;
        next.x = right - w;
        next.y = top;
        next = clampToBounds(next);
        return next;
      }
      case "se": {
        // Top-left fixed.
        const top = startTop;
        const left = startLeft;
        const newRight = startRight + dxNorm;
        const { w, h } = clampSize(newRight - left, 1);
        next.w = w;
        next.h = h;
        next.x = left;
        next.y = top;
        next = clampToBounds(next);
        return next;
      }
      default:
        return draftCropBox;
    }
  };

  const scheduleDraftUpdate = (clientX: number, clientY: number) => {
    latestPointerRef.current = { clientX, clientY };
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      if (!latestPointerRef.current) return;
      const { clientX, clientY } = latestPointerRef.current;
      setDraftCropBox(computeDraftFromPointer(clientX, clientY));
    });
  };

  const handleGrabFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const totalSec = Math.floor(video.currentTime);
      const mins = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const secs = String(totalSec % 60).padStart(2, "0");
      const filename = `frame-${mins}m${secs}s.png`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [videoRef]);

  useEffect(() => {
    if (!file) return;

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    setIsLoading(true);
    const id = ++lastId.current;
    const url = URL.createObjectURL(file);

    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
    }
    urlRef.current = url;

    const video = videoRef.current;
    if (!video) return;

    video.src = url;
    video.load();

    const handleLoaded = () => {
      if (lastId.current !== id) return;
      video.play().catch(() => {});
    };

    onLoadedRef.current = handleLoaded;

    video.addEventListener("loadeddata", handleLoaded);

    return () => {
      if (onLoadedRef.current) {
        video.removeEventListener("loadeddata", onLoadedRef.current);
        onLoadedRef.current = null;
      }

      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      if (urlRef.current === url) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [file, videoRef]);

  useEffect(() => {
    if (!videoRef.current || !recipe) return;
    videoRef.current.muted = !recipe.keepAudio;
  }, [recipe, videoRef]);

  useEffect(() => {
    if (!videoRef.current || !recipe) return;
    videoRef.current.playbackRate = recipe.speed;
  }, [recipe, videoRef]);

  /**
   * Track preview container dimensions for text overlay positioning.
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (previewContainerRef.current) {
        const rect = previewContainerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const overlay = (() => {
    if (!recipe || !showOverlay || recipe.framing !== "fit") return null;

    const preset = recipe.preset === "custom"
      ? { width: recipe.customWidth, height: recipe.customHeight }
      : getPresetById(recipe.preset);

    if (!preset) return null;

    // Preview container is 16:9
    const containerW = 16;
    const containerH = 9;
    const containerRatio = containerW / containerH; // 1.777…
    const outputRatio = preset.width / preset.height;

    // Letterbox: the output video fits entirely inside 16:9, padded with bars.
    if (outputRatio > containerRatio) {
      // Wider output → pillarbox bars on top & bottom
      const contentH = (containerRatio / outputRatio) * 100;
      const barH = (100 - contentH) / 2;
      return { mode: "fit", barTop: `${barH}%`, barBottom: `${barH}%`, barLeft: "0", barRight: "0" };
    }

    // Taller output → letterbox bars on left & right
    const contentW = (outputRatio / containerRatio) * 100;
    const barW = (100 - contentW) / 2;
    return { mode: "fit", barTop: "0", barBottom: "0", barLeft: `${barW}%`, barRight: `${barW}%` };
  })();

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
    <>
      <div
        ref={previewContainerRef}
        role="group"
        className="relative w-full rounded-lg overflow-hidden bg-[var(--bg)] aspect-video focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Video preview (press Space to play/pause)"
      >
        {isLoading && (
          <div
            className="absolute inset-0 animate-pulse bg-[var(--surface)] rounded-xl transition-opacity duration-300"
            aria-label="Loading video preview"
          />
        )}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          controls
          className={cn(
            "w-full h-full transition-opacity duration-300",
            (recipe?.framing === "fill" ? "object-cover" : "object-contain"),
            isLoading ? "opacity-0" : "opacity-100"
          )}
          style={cropPreviewTransform ?? undefined}
          onLoadedData={() => setIsLoading(false)}
          playsInline
          muted={!recipe?.keepAudio}
        >
          <track kind="captions" />
        </video>

        {/* Fit (letterbox) overlay */}
        {overlay && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute left-0 right-0 top-0 bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]" style={{ height: overlay.barTop }} />
            <div className="absolute left-0 right-0 bottom-0 bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]" style={{ height: overlay.barBottom }} />
            <div className="absolute top-0 bottom-0 left-0 bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]" style={{ width: overlay.barLeft }} />
            <div className="absolute top-0 bottom-0 right-0 bg-[color-mix(in_srgb,var(--bg)_60%,transparent)]" style={{ width: overlay.barRight }} />
          </div>
        )}

        {/* Crop selection overlay (fill mode) */}
        {recipe?.framing === "fill" &&
          showOverlay &&
          !isLoading &&
          containerDimensions.width > 0 &&
          cropAspectK &&
          currentCropBox && (
            <div
              className="absolute inset-0 z-20"
              onPointerMove={(e) => {
                const i = interactionRef.current;
                if (!i) return;
                if (i.pointerId !== e.pointerId) return;
                if (recipe?.framing !== "fill") return;
                scheduleDraftUpdate(e.clientX, e.clientY);
              }}
              onPointerUp={() => {
                const i = interactionRef.current;
                if (!i) return;
                // Compute final box from the last known pointer position.
                const latest = latestPointerRef.current;
                if (!latest) {
                  interactionRef.current = null;
                  latestPointerRef.current = null;
                  setIsEditingCrop(false);
                  return;
                }
                const finalBox = computeDraftFromPointer(latest.clientX, latest.clientY);
                setDraftCropBox(finalBox);
                setIsEditingCrop(false);
                interactionRef.current = null;
                latestPointerRef.current = null;
                if (!onCropChange || !recipe) return;
                onCropChange({
                  cropBoxX: finalBox.x,
                  cropBoxY: finalBox.y,
                  cropBoxW: finalBox.w,
                  cropBoxH: finalBox.h,
                });
              }}
              onPointerCancel={() => {
                interactionRef.current = null;
                latestPointerRef.current = null;
                setIsEditingCrop(false);
              }}
            >
              {/* Dark overlay outside the selected box */}
              {(() => {
                const boxLeft = currentCropBox.x * containerDimensions.width;
                const boxTop = currentCropBox.y * containerDimensions.height;
                const boxW = currentCropBox.w * containerDimensions.width;
                const boxH = currentCropBox.h * containerDimensions.height;

                return (
                  <>
                    <div className="absolute left-0 right-0 top-0 bg-[rgba(0,0,0,0.45)]" style={{ height: boxTop }} />
                    <div
                      className="absolute left-0 right-0 bg-[rgba(0,0,0,0.45)]"
                      style={{ top: boxTop + boxH, height: containerDimensions.height - (boxTop + boxH) }}
                    />
                    <div className="absolute top-0 bottom-0 left-0 bg-[rgba(0,0,0,0.45)]" style={{ width: boxLeft }} />
                    <div
                      className="absolute top-0 bottom-0 bg-[rgba(0,0,0,0.45)]"
                      style={{ left: boxLeft + boxW, width: containerDimensions.width - (boxLeft + boxW) }}
                    />
                  </>
                );
              })()}

              {/* Selected crop box */}
              {(() => {
                const boxLeft = currentCropBox.x * containerDimensions.width;
                const boxTop = currentCropBox.y * containerDimensions.height;
                const boxW = currentCropBox.w * containerDimensions.width;
                const boxH = currentCropBox.h * containerDimensions.height;

                const handleSize = 10;
                const half = handleSize / 2;

                const handle = (handleId: ResizeHandle, xPx: number, yPx: number) => (
                  <div
                    key={handleId}
                    data-handle={handleId}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      startEdit(handleId, e);
                    }}
                    className="absolute bg-film-400 rounded-sm shadow-[0_0_0_2px_rgba(0,0,0,0.25)]"
                    style={{
                      width: handleSize,
                      height: handleSize,
                      left: xPx - half,
                      top: yPx - half,
                      cursor:
                        handleId === "nw"
                          ? "nwse-resize"
                          : handleId === "se"
                          ? "nwse-resize"
                          : handleId === "ne"
                          ? "nesw-resize"
                          : handleId === "sw"
                          ? "nesw-resize"
                          : handleId === "n" || handleId === "s"
                          ? "ns-resize"
                          : handleId === "e" || handleId === "w"
                          ? "ew-resize"
                          : "grab",
                    }}
                    aria-hidden="true"
                  />
                );

                const frameStyle: React.CSSProperties = {
                  left: boxLeft,
                  top: boxTop,
                  width: boxW,
                  height: boxH,
                };

                return (
                  <div
                    className="absolute border-2 border-film-400 pointer-events-auto"
                    style={{ ...frameStyle, cursor: isEditingCrop ? "grabbing" : "grab" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      startEdit("move", e);
                    }}
                    aria-hidden="true"
                  >
                    {/* Border fill hint */}
                    <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] rounded-[2px]" />

                    {/* Resize handles */}
                    {handle("nw", 0, 0)}
                    {handle("ne", boxW, 0)}
                    {handle("sw", 0, boxH)}
                    {handle("se", boxW, boxH)}
                    {handle("n", boxW / 2, 0)}
                    {handle("s", boxW / 2, boxH)}
                    {handle("w", 0, boxH / 2)}
                    {handle("e", boxW, boxH / 2)}
                  </div>
                );
              })()}
            </div>
          )}

        {/* Draggable Text Overlays */}
        {recipe && !isLoading && containerDimensions.width > 0 && (
          <DraggableTextOverlays
            recipe={recipe}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            selectedTextId={selectedTextId ?? null}
            onSelectText={onSelectText || (() => {})}
            onUpdateText={onUpdateText || (() => {})}
          />
        )}

        {/* Toggle button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${
              showOverlay
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"
            }`}
            aria-pressed={showOverlay}
            aria-label={showOverlay ? "Hide framing overlay" : "Show framing overlay"}
            title={showOverlay ? "Hide framing overlay" : "Show framing overlay"}
          >
            {showOverlay ? "Hide overlay" : "Show overlay"}
          </button>
        )}

        {/* Compare button */}
        {recipe && !isLoading && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={`absolute top-2 right-32 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto ${
              showComparison
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"
            }`}
            aria-pressed={showComparison}
            aria-label={showComparison ? "Hide comparison preview" : "Show comparison preview"}
            title={showComparison ? "Hide comparison preview" : "Show comparison preview"}
          >
            Compare
          </button>
        )}

        {/* Grab frame button */}
        {!isLoading && (
          <button
            type="button"
            onClick={handleGrabFrame}
            className="absolute top-2 right-2 px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded transition-colors z-10 pointer-events-auto bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)] flex items-center gap-1"
            aria-label="Grab frame as PNG"
            title="Download current frame as PNG"
          >
            <Camera className="w-3 h-3" />
            Grab frame
          </button>
        )}
      </div>

      {showComparison && file && (
        <div className="mt-4">
          <ComparisonPreview file={file} recipe={recipe} videoRef={videoRef} />
        </div>
      )}
    </>
  );
}
