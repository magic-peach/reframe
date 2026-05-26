"use client";

import { EditRecipe, TrimSegment } from "@/lib/types";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AlertCircle, Scissors, Plus, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import {
  generateSegmentId,
  getCutRegions,
  addSplitPoint,
  removeSegment,
  updateSegmentBound,
  totalSegmentsDuration,
  validateSegments,
  mergeWithNextSegment,
} from "@/lib/trim-segments";

const MIN_CLIP_DURATION = 0.1;

interface Props {
  readonly recipe: EditRecipe;
  readonly onChange: (patch: Partial<EditRecipe>) => void;
  readonly duration: number;
  readonly file: File | null;
  readonly currentTime?: number;
}

export default function TrimControl({ recipe, onChange, duration, file, currentTime }: Props) {
  const [invalidStart, setInvalidStart] = useState(false);
  const [invalidEnd, setInvalidEnd] = useState(false);
  const [startErrorMsg, setStartErrorMsg] = useState("");
  const [endErrorMsg, setEndErrorMsg] = useState("");
  const [startInput, setStartInput] = useState(
    recipe.trimStart.toString()
  );

  useEffect(() => {
    setStartInput(recipe.trimStart.toString());
  }, [recipe.trimStart]);

  const segments = useMemo(() => recipe.trimSegments ?? [], [recipe.trimSegments]);
  const isMultiSeg = segments.length > 0;

  const clipLength = isMultiSeg
    ? totalSegmentsDuration(segments)
    : (recipe.trimEnd ?? duration) - recipe.trimStart;

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"start" | "end" | null>(null);
  const draggingSegBound = useRef<{ segId: string; field: "start" | "end" } | null>(null);
  // Prevents the timeline click from firing a split after a drag release
  const wasDragging = useRef(false);

  const xToSeconds = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || duration <= 0) return 0;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return Number.parseFloat((ratio * duration).toFixed(1));
  }, [duration]);

  const applyDrag = useCallback((clientX: number) => {
    const seconds = xToSeconds(clientX);

    // Multi-segment drag
    if (draggingSegBound.current) {
      const { segId, field } = draggingSegBound.current;
      const updated = updateSegmentBound(segments, segId, field, seconds, duration);
      onChange({ trimSegments: updated });
      return;
    }

    // Single-trim drag
    if (dragging.current === "start") {
      const clamped = Math.min(seconds, (recipe.trimEnd ?? duration) - 0.1);
      onChange({ trimStart: Math.max(0, clamped) });
    } else if (dragging.current === "end") {
      const clamped = Math.max(seconds, recipe.trimStart + 0.1);
      onChange({ trimEnd: Math.min(duration, clamped) });
    }
  }, [xToSeconds, duration, recipe.trimStart, recipe.trimEnd, segments, onChange]);

 useEffect(() => {
  const onMove = (e: MouseEvent | TouchEvent) => {
    let clientX: number;

    if ("touches" in e) {
      const touch = e.touches[0];

      if (!touch) return;

      clientX = touch.clientX;
    } else {
      clientX = e.clientX;
    }

    applyDrag(clientX);
  };

  const onUp = () => {
    // Mark that we just finished a drag so onClick doesn't create a split
    if (dragging.current || draggingSegBound.current) {
      wasDragging.current = true;
    }
    dragging.current = null;
    draggingSegBound.current = null;
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
  document.addEventListener("touchmove", onMove);
  document.addEventListener("touchend", onUp);

  return () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);
  };
}, [applyDrag]);

  // ── Multi-segment operations ──

  const handleEnableMultiSegment = useCallback(() => {
    if (duration <= 0) return;
    // Initialize with a single full-range segment
    const fullSegment: TrimSegment = {
      id: generateSegmentId(),
      start: recipe.trimStart,
      end: recipe.trimEnd ?? duration,
    };
    onChange({ trimSegments: [fullSegment] });
  }, [duration, recipe.trimStart, recipe.trimEnd, onChange]);

  const handleAddSplit = useCallback(() => {
    if (segments.length === 0) return;
    
    // First try splitting at the current video playhead
    if (typeof currentTime === "number") {
      const updated = addSplitPoint(segments, currentTime);
      // If it successfully split (length changed), we're done
      if (updated.length > segments.length) {
        onChange({ trimSegments: updated });
        return;
      }
    }
    
    // Fallback: Find the largest segment and split it at its midpoint
    const sorted = [...segments].sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const largest = sorted[0];
    if (!largest) return;
    const midPoint = (largest.start + largest.end) / 2;
    const updated = addSplitPoint(segments, midPoint);
    onChange({ trimSegments: updated });
  }, [segments, currentTime, onChange]);

  const handleRemoveSegment = useCallback((segId: string) => {
    const updated = removeSegment(segments, segId);
    onChange({ trimSegments: updated });
  }, [segments, onChange]);

  const handleDisableMultiSegment = useCallback(() => {
    onChange({ trimSegments: [], trimStart: 0, trimEnd: null });
  }, [onChange]);

  const segmentError = isMultiSeg ? validateSegments(segments, duration) : null;

  // ── Handlers for the legacy single-trim inputs ──
  const handleStart = (val: string) => {
    setStartInput(val);

    if (val === "") {
      setInvalidStart(false);
      setStartErrorMsg("");
      return;
    }

    const n = Number.parseFloat(val);

    if (Number.isNaN(n)) {
      setInvalidStart(true);
      setStartErrorMsg("Enter a valid number.");
      return;
    }

    if (n < 0) {
      setInvalidStart(true);
      setStartErrorMsg("Start time must be 0 or greater.");
      return;
    }

    if (duration > 0 && n >= duration) {
      setInvalidStart(true);
      setStartErrorMsg(
        `Start time must be less than duration (${duration.toFixed(1)}s).`
      );
      return;
    }

    if (recipe.trimEnd !== null && n >= recipe.trimEnd - MIN_CLIP_DURATION) {
      setInvalidStart(true);
      setStartErrorMsg("Start time must be less than the end time.");
      return;
    }

    setInvalidStart(false);
    setStartErrorMsg("");
    onChange({ trimStart: n });
  };

  const handleEnd = (val: string) => {
    if (val === "") {
      onChange({ trimEnd: null });
      setInvalidEnd(false);
      return;
    }

    const n = Number.parseFloat(val);

    if (Number.isNaN(n)) {
      setInvalidEnd(true);
      setEndErrorMsg("Enter a valid number.");
      return;
    }

    if (n <= 0) {
      setInvalidEnd(true);
      setEndErrorMsg("End time must be greater than 0.");
      return;
    }

    if (n <= recipe.trimStart + MIN_CLIP_DURATION) {
      setInvalidEnd(true);
      setEndErrorMsg("End time must be greater than start time.");
      return;
    }

    if (duration > 0 && n > duration + 0.01) {
      setInvalidEnd(true);
      setEndErrorMsg(
        `End time cannot exceed duration (${duration.toFixed(1)}s).`,
      );
      return;
    }

    setInvalidEnd(false);
    setEndErrorMsg("");
    onChange({ trimEnd: n });
  };

  const inputClass =
    "w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 text-[var(--text)] transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div id="trim-control" className="space-y-3">
      {/* Multi-segment toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={isMultiSeg ? handleDisableMultiSegment : handleEnableMultiSegment}
          disabled={duration <= 0}
          className={`flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-widest transition-all ${
            isMultiSeg
              ? "text-film-600 hover:text-film-700"
              : "text-[var(--muted)] hover:text-film-500"
          }`}
        >
          <Scissors size={12} />
          {isMultiSeg ? "Multi-Cut: ON" : "Enable Multi-Cut"}
        </button>
        {isMultiSeg && (
          <button
            type="button"
            onClick={handleAddSplit}
            className="flex items-center gap-1 text-xs font-heading font-bold uppercase tracking-widest text-film-500 hover:text-film-600 transition-all"
          >
            <Plus size={12} />
            Add Split
          </button>
        )}
      </div>

      {/* ── Multi-segment timeline ── */}
      {isMultiSeg && duration > 0 && (
        <div className="space-y-2">
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            ref={trackRef}
            className="relative h-8 rounded-md overflow-hidden cursor-pointer select-none bg-[var(--border)]"
            onClick={(e) => {
              // Suppress accidental splits caused by mouseup after a drag
              if (wasDragging.current) {
                wasDragging.current = false;
                return;
              }
              if (draggingSegBound.current) return;
              const t = xToSeconds(e.clientX);
              const updated = addSplitPoint(segments, t);
              onChange({ trimSegments: updated });
            }}
          >
            {/* Full track background */}
            <div className="absolute inset-0 bg-[var(--border)]" />

            {/* Cut regions (dimmed) */}
            {getCutRegions(segments, duration).map((cut) => (
              <div
                key={`cut-${cut.start}-${cut.end}`}
                className="absolute top-0 bottom-0"
                style={{
                  left: `${(cut.start / duration) * 100}%`,
                  width: `${((cut.end - cut.start) / duration) * 100}%`,
                  background: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(239,68,68,0.15) 3px, rgba(239,68,68,0.15) 6px)",
                }}
              />
            ))}

            {/* Keep segments (accent colored) */}
            {[...segments].sort((a, b) => a.start - b.start).map((seg) => (
              <div
                key={seg.id}
                className="absolute top-0 bottom-0 bg-film-400/40 border-y border-film-400/60 group flex items-center justify-center"
                style={{
                  left: `${(seg.start / duration) * 100}%`,
                  width: `${((seg.end - seg.start) / duration) * 100}%`,
                }}
              >
                {/* Delete button (shows on hover) */}
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/80 text-white rounded hover:bg-red-500 transition-all z-10 scale-75 hover:scale-100"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent adding a split point
                    handleRemoveSegment(seg.id);
                  }}
                  title="Remove segment"
                >
                  <Trash2 size={12} />
                </button>
                {/* Start handle — double-click to merge with previous segment */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Split point at ${seg.start.toFixed(1)}s`}
                  title="Double-click to remove this split"
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-film-500 hover:bg-film-600 transition-colors z-20"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const sorted = [...segments].sort((a, b) => a.start - b.start);
                    const idx = sorted.findIndex(s => s.id === seg.id);
                    if (idx > 0) {
                      const prev = sorted[idx - 1];
                      if (prev) {
                        const updated = mergeWithNextSegment(segments, prev.id);
                        onChange({ trimSegments: updated });
                      }
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    draggingSegBound.current = { segId: seg.id, field: "start" };
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    draggingSegBound.current = { segId: seg.id, field: "start" };
                  }}
                />
                {/* End handle — double-click to merge with next segment */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Split point at ${seg.end.toFixed(1)}s`}
                  title="Double-click to remove this split"
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-film-500 hover:bg-film-600 transition-colors z-20"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const updated = mergeWithNextSegment(segments, seg.id);
                    if (updated !== segments) {
                      onChange({ trimSegments: updated });
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    draggingSegBound.current = { segId: seg.id, field: "end" };
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    draggingSegBound.current = { segId: seg.id, field: "end" };
                  }}
                />
              </div>
            ))}
          </div>

          {/* Segment list */}
          <div className="space-y-1.5">
            {[...segments].sort((a, b) => a.start - b.start).map((seg, i) => (
              <div
                key={seg.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--bg)] border border-[var(--border)] text-xs"
              >
                <span className="font-heading font-bold text-film-500 w-4">{i + 1}</span>
                <span className="text-[var(--muted)] font-mono flex-1">
                  {formatDuration(seg.start)} → {formatDuration(seg.end)}
                </span>
                <span className="text-[var(--muted)] font-mono">
                  ({formatDuration(seg.end - seg.start)})
                </span>
                {segments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSegment(seg.id)}
                    className="text-red-400 hover:text-red-500 transition-colors p-0.5"
                    aria-label={`Remove segment ${i + 1}`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {segmentError && (
            <p className="font-heading animate-fade-in mt-1.5 flex items-center gap-1 text-[10px] text-red-500">
              <AlertCircle size={10} className="shrink-0" />
              {segmentError}
            </p>
          )}

          <p className="text-xs text-[var(--muted)]">
            Tip: Click the timeline to add a split point. Drag the edges to adjust.
          </p>
        </div>
      )}

      {/* ── Legacy single-trim timeline ── */}
      {!isMultiSeg && duration > 0 && (
        <div
          role="toolbar"
          aria-label="Trim timeline"
          ref={trackRef}
          className="relative h-6 flex items-center cursor-pointer select-none"
          onClick={(e) => {
            if (dragging.current) return;
            const s = xToSeconds(e.clientX);
            onChange({ trimStart: s });
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onChange({ trimStart: Math.max(0, recipe.trimStart - 0.1) });
            if (e.key === "ArrowRight") onChange({ trimStart: Math.min((recipe.trimEnd ?? duration) - 0.1, recipe.trimStart + 0.1) });
          }}
        >
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-[var(--border)]" />
          <div
            className="absolute h-1.5 rounded-full bg-film-400 opacity-60"
            style={{
              left: `${(recipe.trimStart / duration) * 100}%`,
              right: `${((duration - (recipe.trimEnd ?? duration)) / duration) * 100}%`,
            }}
          />
          <div
            role="slider"
            aria-label="Trim start"
            aria-valuenow={recipe.trimStart}
            aria-valuemin={0}
            aria-valuemax={duration}
            tabIndex={0}
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-film-400 shadow cursor-grab active:cursor-grabbing -translate-x-1/2 focus:outline-none focus:ring-2 focus:ring-film-400"
            style={{ left: `${(recipe.trimStart / duration) * 100}%` }}
            onMouseDown={() => { dragging.current = "start"; }}
            onTouchStart={() => { dragging.current = "start"; }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") onChange({ trimStart: Math.max(0, recipe.trimStart - 0.1) });
              if (e.key === "ArrowRight") onChange({ trimStart: Math.min((recipe.trimEnd ?? duration) - 0.1, recipe.trimStart + 0.1) });
            }}
          />
          <div
            role="slider"
            aria-label="Trim end"
            aria-valuenow={recipe.trimEnd ?? duration}
            aria-valuemin={0}
            aria-valuemax={duration}
            tabIndex={0}
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-film-400 shadow cursor-grab active:cursor-grabbing -translate-x-1/2 focus:outline-none focus:ring-2 focus:ring-film-400"
            style={{ left: `${((recipe.trimEnd ?? duration) / duration) * 100}%` }}
            onMouseDown={() => { dragging.current = "end"; }}
            onTouchStart={() => { dragging.current = "end"; }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") onChange({ trimEnd: Math.max(recipe.trimStart + 0.1, (recipe.trimEnd ?? duration) - 0.1) });
              if (e.key === "ArrowRight") onChange({ trimEnd: Math.min(duration, (recipe.trimEnd ?? duration) + 0.1) });
            }}
          />
        </div>
      )}

      {/* Legacy single-trim inputs */}
      {!isMultiSeg && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label
              htmlFor="trim-start"
              className="font-heading mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]"
            >
              Start (sec)
            </label>

            <input
              id="trim-start"
              type="number"
              autoComplete="off"
              min={0}
              max={duration > 0 ? duration : undefined}
              step={0.1}
              value={startInput}
              spellCheck={false}
              onChange={(e) => handleStart(e.target.value)}
              aria-label="Trim start time in seconds"
              aria-invalid={invalidStart}
              aria-describedby={invalidStart ? "trim-start-error" : undefined}
              className={`${inputClass} ${
                invalidStart ? "border-[var(--error)]" : "border-[var(--border)]"
              }`}
              placeholder="0"
            />
            {invalidStart && (
              <p
                id="trim-start-error"
                className="font-heading animate-fade-in mt-1.5 flex items-center gap-1 text-[10px] text-red-500"
              >
                <AlertCircle size={10} className="shrink-0" />
                {startErrorMsg}
              </p>
            )}
          </div>

          <div className="flex-1">
            <label
              htmlFor="trim-end"
              className="font-heading mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]"
            >
              End (sec)
            </label>

            <input
              id="trim-end"
              type="number"
              autoComplete="off"
              min={0}
              max={duration > 0 ? duration : undefined}
              step={0.1}
              value={recipe.trimEnd ?? ""}
              spellCheck={false}
              onChange={(e) => handleEnd(e.target.value)}
              aria-label="Trim end time in seconds"
              aria-invalid={invalidEnd}
              aria-describedby={invalidEnd ? "trim-end-error" : undefined}
              className={`${inputClass} ${
                invalidEnd ? "border-[var(--error)]" : "border-[var(--border)]"
              }`}
              placeholder={duration > 0 ? `${duration.toFixed(1)}` : "full length"}
            />
            {invalidEnd && (
              <p
                id="trim-end-error"
                className="font-heading animate-fade-in mt-1.5 flex items-center gap-1 text-[10px] text-red-500"
              >
                <AlertCircle size={10} className="shrink-0" />
                {endErrorMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {duration > 0 && (
        <p className="text-sm text-[var(--muted)] font-heading mt-1">
          {isMultiSeg ? (
            <>
              Output: {formatDuration(clipLength)} from{" "}
              {segments.length} segment{segments.length > 1 ? "s" : ""} of{" "}
              {formatDuration(duration)}
            </>
          ) : (
            <>
              Clip: {formatDuration(clipLength)} of{" "}
              {formatDuration(duration)}
            </>
          )}
        </p>
      )}
      {!isMultiSeg && recipe.trimEnd !== null &&
        recipe.trimEnd - recipe.trimStart < MIN_CLIP_DURATION && (
          <p className="text-[10px] text-[var(--error)] font-heading">
            Clip must be at least 0.1 seconds long.
          </p>
      )}
    </div>
  );
}
