"use client";
 
import Image from "next/image";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { EditRecipe } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";
import { GripVertical } from "lucide-react";
 
interface Thumbnail {
  time: number;
  dataUrl: string;
}
 
interface TimelineEditorProps {
  videoSrc: string | null;
  duration: number;
  currentTime: number;
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  onSeek: (time: number) => void;
}
 
export default function TimelineEditor({
  videoSrc,
  duration,
  currentTime,
  recipe,
  onChange,
  onSeek,
}: TimelineEditorProps) {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
 
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"start" | "end" | "clip" | "playhead" | null>(null);
  const dragStartOffsetRef = useRef<number>(0);
  const dragStartClipRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
 
  const lastRunIdRef = useRef(0);
  const objectUrlsRef = useRef<string[]>([]);
  const offscreenVideoRef = useRef<HTMLVideoElement | null>(null);
 
  const effectiveTrimEnd = recipe.trimEnd ?? duration;
  const clipLength = effectiveTrimEnd - recipe.trimStart;
 
  // State for snapping guide
  const [snapGuideTime, setSnapGuideTime] = useState<number | null>(null);
 
  const revokeAllObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }, []);
 
  const cancelThumbnailRun = useCallback(() => {
    lastRunIdRef.current += 1;
  }, []);
 
  // Determine snap intervals
  const snapStep = useMemo(() => {
    if (duration <= 15) return 1;
    if (duration <= 60) return 2;
    if (duration <= 180) return 5;
    return 10;
  }, [duration]);
 
  // ── Thumbnail Generation ──
  const generateThumbnails = useCallback(async () => {
    if (!videoSrc || duration <= 0) return;
 
    const runId = ++lastRunIdRef.current;
    setIsGenerating(true);
    revokeAllObjectUrls();
    setThumbnails([]);
    setProgress(0);
 
    const video = document.createElement("video");
    offscreenVideoRef.current = video;
 
    try {
      video.src = videoSrc;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.preload = "auto";
 
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Video load failed"));
        video.load();
      });
 
      if (lastRunIdRef.current !== runId) return;
 
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
 
      const thumbW = 160;
      const thumbH = 90;
      canvas.width = thumbW;
      canvas.height = thumbH;
 
      // Calculate how many frames to extract to fit perfectly on screen
      const times: number[] = [];
      const interval = Math.max(0.5, duration / 12); // extract up to 12 frames
      for (let t = 0; t <= duration; t += interval) {
        times.push(Math.min(t, duration - 0.1));
      }
      if ((times[times.length - 1] ?? 0) < duration - 0.2) {
        times.push(duration - 0.1);
      }
 
      const captured: Thumbnail[] = [];
 
      for (let i = 0; i < times.length; i++) {
        if (lastRunIdRef.current !== runId) break;
 
        const time = times[i] ?? 0;
        await new Promise<void>((resolve) => {
          const onSeeked = async () => {
            video.removeEventListener("seeked", onSeeked);
 
            if (lastRunIdRef.current !== runId) {
              resolve();
              return;
            }
 
            ctx.drawImage(video, 0, 0, thumbW, thumbH);
 
            try {
              const blob = await new Promise<Blob | null>((blobResolve) => {
                canvas.toBlob((b) => blobResolve(b), "image/jpeg", 0.6);
              });
              if (blob && lastRunIdRef.current === runId) {
                const url = URL.createObjectURL(blob);
                objectUrlsRef.current.push(url);
                captured.push({ time, dataUrl: url });
                setThumbnails([...captured]);
              }
            } catch (err) {
              console.error("Failed to generate thumbnail blob", err);
            }
 
            setProgress(Math.round(((i + 1) / times.length) * 100));
            resolve();
          };
          video.addEventListener("seeked", onSeeked);
          video.currentTime = time;
        });
      }
 
      if (lastRunIdRef.current === runId) {
        setIsGenerating(false);
      }
    } finally {
      video.src = "";
      if (offscreenVideoRef.current === video) {
        offscreenVideoRef.current = null;
      }
    }
  }, [videoSrc, duration, revokeAllObjectUrls]);
 
  useEffect(() => {
    if (videoSrc && duration > 0) {
      generateThumbnails();
    }
    return () => {
      cancelThumbnailRun();
      revokeAllObjectUrls();
    };
  }, [cancelThumbnailRun, generateThumbnails, revokeAllObjectUrls, videoSrc, duration]);
 
  // ── Drag & Drop Interactions ──
  const xToSeconds = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || duration <= 0) return 0;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return ratio * duration;
  }, [duration]);
 
  // Snapping calculations
  const calculateSnap = useCallback((seconds: number, threshold = 0.25) => {
    // Candidates for snapping: start (0), end (duration), and multiples of snapStep
    const candidates: number[] = [0, duration];
    for (let t = snapStep; t < duration; t += snapStep) {
      candidates.push(t);
    }
 
    let closestTime = seconds;
    let minDistance = Infinity;
 
    candidates.forEach((cand) => {
      const dist = Math.abs(seconds - cand);
      if (dist < minDistance && dist <= threshold) {
        minDistance = dist;
        closestTime = cand;
      }
    });
 
    return {
      time: closestTime,
      snapped: minDistance !== Infinity && closestTime !== seconds,
    };
  }, [duration, snapStep]);
 
  const handleDrag = useCallback((clientX: number) => {
    if (!draggingRef.current || duration <= 0) return;
 
    const currentSeconds = xToSeconds(clientX);
 
    if (draggingRef.current === "playhead") {
      const snap = calculateSnap(currentSeconds, 0.15);
      onSeek(Math.max(0, Math.min(duration, snap.time)));
      setSnapGuideTime(snap.snapped ? snap.time : null);
    } else if (draggingRef.current === "start") {
      const snap = calculateSnap(currentSeconds, 0.25);
      const clamped = Math.max(0, Math.min(snap.time, effectiveTrimEnd - 0.1));
      onChange({ trimStart: parseFloat(clamped.toFixed(2)) });
      setSnapGuideTime(snap.snapped ? clamped : null);
    } else if (draggingRef.current === "end") {
      const snap = calculateSnap(currentSeconds, 0.25);
      const clamped = Math.min(duration, Math.max(snap.time, recipe.trimStart + 0.1));
      onChange({ trimEnd: parseFloat(clamped.toFixed(2)) });
      setSnapGuideTime(snap.snapped ? clamped : null);
    } else if (draggingRef.current === "clip") {
      const deltaSeconds = currentSeconds - dragStartOffsetRef.current;
      let newStart = dragStartClipRef.current.start + deltaSeconds;
      let newEnd = dragStartClipRef.current.end + deltaSeconds;
 
      // Handle boundaries
      if (newStart < 0) {
        newEnd -= newStart;
        newStart = 0;
      }
      if (newEnd > duration) {
        newStart -= (newEnd - duration);
        newEnd = duration;
      }
 
      // Snap both sides together
      const startSnap = calculateSnap(newStart, 0.25);
      const endSnap = calculateSnap(newEnd, 0.25);
 
      let activeSnapTime: number | null = null;
      if (startSnap.snapped) {
        const offset = startSnap.time - newStart;
        newStart = startSnap.time;
        newEnd = Math.min(duration, newEnd + offset);
        activeSnapTime = startSnap.time;
      } else if (endSnap.snapped) {
        const offset = endSnap.time - newEnd;
        newEnd = endSnap.time;
        newStart = Math.max(0, newStart + offset);
        activeSnapTime = endSnap.time;
      }
 
      onChange({
        trimStart: parseFloat(newStart.toFixed(2)),
        trimEnd: parseFloat(newEnd.toFixed(2)),
      });
      setSnapGuideTime(activeSnapTime);
    }
  }, [xToSeconds, duration, effectiveTrimEnd, recipe.trimStart, onChange, onSeek, calculateSnap]);
 
  const handleMouseDown = (
    e: React.MouseEvent,
    type: "start" | "end" | "clip" | "playhead"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = type;
 
    const clientX = e.clientX;
    const currentSecs = xToSeconds(clientX);
    dragStartOffsetRef.current = currentSecs;
    dragStartClipRef.current = { start: recipe.trimStart, end: effectiveTrimEnd };
 
    if (type === "playhead") {
      handleDrag(clientX);
    }
  };
 
  const handleTouchStart = (
    e: React.TouchEvent,
    type: "start" | "end" | "clip" | "playhead"
  ) => {
    const touch = e.touches[0];
    if (!touch) return;
    e.stopPropagation();
    draggingRef.current = type;
 
    const clientX = touch.clientX;
    const currentSecs = xToSeconds(clientX);
    dragStartOffsetRef.current = currentSecs;
    dragStartClipRef.current = { start: recipe.trimStart, end: effectiveTrimEnd };
 
    if (type === "playhead") {
      handleDrag(clientX);
    }
  };
 
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      
      let clientX: number;
      if ("touches" in e) {
        const touch = e.touches[0];
        if (!touch) return;
        clientX = touch.clientX;
      } else {
        clientX = e.clientX;
      }
      
      handleDrag(clientX);
    };
 
    const onUp = () => {
      draggingRef.current = null;
      setSnapGuideTime(null);
    };
 
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onUp);
 
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };
  }, [handleDrag]);
 
  // Grid tick markers for the time ruler
  const ticks = useMemo(() => {
    const result: { time: number; label: string; xPct: number }[] = [];
    const tickInterval = snapStep;
    for (let t = 0; t <= duration; t += tickInterval) {
      const minutes = Math.floor(t / 60);
      const seconds = Math.floor(t % 60);
      result.push({
        time: t,
        label: `${minutes}:${seconds.toString().padStart(2, "0")}`,
        xPct: (t / duration) * 100,
      });
    }
    return result;
  }, [duration, snapStep]);
 
  if (!videoSrc || duration <= 0) return null;
 
  const playheadPct = (currentTime / duration) * 100;
  const clipLeftPct = (recipe.trimStart / duration) * 100;
  const clipRightPct = ((duration - effectiveTrimEnd) / duration) * 100;
 
  return (
    <div className="timeline-editor-wrapper select-none animate-fade-in">
      {/* ── Time Ruler ticks ── */}
      <div
        className="timeline-ruler"
        onMouseDown={(e) => handleMouseDown(e, "playhead")}
        onTouchStart={(e) => handleTouchStart(e, "playhead")}
        role="slider"
        aria-label="Timeline time ruler"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 1));
          if (e.key === "ArrowRight") onSeek(Math.min(duration, currentTime + 1));
        }}
      >
        {ticks.map((tick) => (
          <div
            key={tick.time}
            className="ruler-tick"
            style={{ left: `${tick.xPct}%` }}
          >
            <span className="tick-label">{tick.label}</span>
          </div>
        ))}
      </div>
 
      {/* ── Visual Frame Track & Interactivity ── */}
      <div className="timeline-track-container" ref={trackRef}>
        
        {/* Continuous backdrop of generated thumbnails */}
        <div className="track-thumbnails">
          {thumbnails.length === 0 && isGenerating && (
            <div className="track-skeleton">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-frame" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          )}
          {thumbnails.length > 0 && (
            <div className="track-frames-inner">
              {thumbnails.map((thumb) => (
                <div key={thumb.time} className="track-frame">
                  <Image
                    src={thumb.dataUrl}
                    alt="Timeline Frame"
                    fill
                    sizes="120px"
                    unoptimized
                    draggable={false}
                    className="object-cover opacity-60 grayscale-[10%]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
 
        {/* Dimmer overlays for regions out of trim bounds */}
        <div className="track-dimmer track-dimmer-left" style={{ width: `${clipLeftPct}%` }} />
        <div className="track-dimmer track-dimmer-right" style={{ width: `${clipRightPct}%` }} />
 
        {/* Draggable Active Clip Box */}
        <div
          className="timeline-clip-active"
          style={{
            left: `${clipLeftPct}%`,
            right: `${clipRightPct}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, "clip")}
          onTouchStart={(e) => handleTouchStart(e, "clip")}
          role="button"
          tabIndex={0}
          aria-label="Active video clip range"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              const newStart = Math.max(0, recipe.trimStart - 0.1);
              const offset = recipe.trimStart - newStart;
              onChange({ trimStart: parseFloat(newStart.toFixed(2)), trimEnd: parseFloat((effectiveTrimEnd - offset).toFixed(2)) });
            }
            if (e.key === "ArrowRight") {
              const newEnd = Math.min(duration, effectiveTrimEnd + 0.1);
              const offset = newEnd - effectiveTrimEnd;
              onChange({ trimStart: parseFloat((recipe.trimStart + offset).toFixed(2)), trimEnd: parseFloat(newEnd.toFixed(2)) });
            }
          }}
        >
          {/* Trim Handles */}
          <div
            className="trim-handle trim-handle-left"
            onMouseDown={(e) => handleMouseDown(e, "start")}
            onTouchStart={(e) => handleTouchStart(e, "start")}
            role="slider"
            aria-label="Drag start trim handle"
            aria-valuenow={recipe.trimStart}
            aria-valuemin={0}
            aria-valuemax={duration}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") onChange({ trimStart: Math.max(0, recipe.trimStart - 0.1) });
              if (e.key === "ArrowRight") onChange({ trimStart: Math.min(effectiveTrimEnd - 0.1, recipe.trimStart + 0.1) });
            }}
          >
            <GripVertical size={14} className="text-white drop-shadow" />
          </div>
          
          <div
            className="trim-handle trim-handle-right"
            onMouseDown={(e) => handleMouseDown(e, "end")}
            onTouchStart={(e) => handleTouchStart(e, "end")}
            role="slider"
            aria-label="Drag end trim handle"
            aria-valuenow={effectiveTrimEnd}
            aria-valuemin={0}
            aria-valuemax={duration}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") onChange({ trimEnd: Math.max(recipe.trimStart + 0.1, effectiveTrimEnd - 0.1) });
              if (e.key === "ArrowRight") onChange({ trimEnd: Math.min(duration, effectiveTrimEnd + 0.1) });
            }}
          >
            <GripVertical size={14} className="text-white drop-shadow" />
          </div>
        </div>
 
        {/* Snap Guide Line */}
        {snapGuideTime !== null && (
          <div
            className="snap-guide-line"
            style={{ left: `${(snapGuideTime / duration) * 100}%` }}
          />
        )}
 
        {/* Vertical Red Playhead Bar */}
        <div
          className="timeline-playhead-bar"
          style={{ left: `${playheadPct}%` }}
          onMouseDown={(e) => handleMouseDown(e, "playhead")}
          onTouchStart={(e) => handleTouchStart(e, "playhead")}
          role="slider"
          aria-label="Playhead scrubber"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 1));
            if (e.key === "ArrowRight") onSeek(Math.min(duration, currentTime + 1));
          }}
        >
          <div className="playhead-head" />
        </div>
      </div>
 
      {/* ── Metadata / Status Overlay ── */}
      <div className="timeline-meta flex items-center justify-between text-xs px-3 py-2 bg-[var(--surface)] text-[var(--muted)] font-heading border-t border-[var(--border)]">
        <span className="flex items-center gap-1">
          🎬 Clip range: <span className="font-bold text-[var(--text)]">{recipe.trimStart.toFixed(1)}s – {effectiveTrimEnd.toFixed(1)}s</span>
        </span>
        <span className="flex items-center gap-1">
          ⏰ Length: <span className="font-bold text-film-600">{formatDuration(clipLength)}</span> of {formatDuration(duration)}
        </span>
      </div>
 
      <style>{`
        .timeline-editor-wrapper {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          font-family: inherit;
        }
 
        .timeline-ruler {
          position: relative;
          height: 24px;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          cursor: pointer;
        }
 
        .ruler-tick {
          position: absolute;
          top: 0;
          height: 100%;
          width: 1px;
          background: var(--border);
        }
 
        .tick-label {
          position: absolute;
          left: 4px;
          bottom: 2px;
          font-size: 8px;
          font-family: 'SF Mono', 'Fira Code', monospace;
          color: var(--muted);
          font-weight: 500;
        }
 
        .timeline-track-container {
          position: relative;
          height: 64px;
          background: var(--bg);
          overflow: hidden;
        }
 
        .track-thumbnails {
          position: absolute;
          inset: 0;
          display: flex;
        }
 
        .track-skeleton {
          display: flex;
          gap: 2px;
          width: 100%;
          height: 100%;
        }
 
        .skeleton-frame {
          flex: 1;
          height: 100%;
          background: linear-gradient(90deg, var(--bg) 25%, var(--surface) 50%, var(--bg) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
 
        .track-frames-inner {
          display: flex;
          width: 100%;
          height: 100%;
          gap: 2px;
        }
 
        .track-frame {
          position: relative;
          flex: 1;
          height: 100%;
        }
 
        .track-dimmer {
          position: absolute;
          top: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(1px);
          z-index: 1;
          pointer-events: none;
        }
 
        .track-dimmer-left {
          left: 0;
        }
 
        .track-dimmer-right {
          right: 0;
        }
 
        .timeline-clip-active {
          position: absolute;
          top: 2px;
          bottom: 2px;
          background: var(--accent-muted);
          border: 2px solid var(--accent);
          border-radius: 4px;
          z-index: 2;
          cursor: grab;
          box-shadow: inset 0 0 10px rgba(var(--accent-rgb), 0.15), var(--shadow);
        }
 
        .timeline-clip-active:active {
          cursor: grabbing;
          background: var(--accent-hover-muted);
        }
 
        .trim-handle {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 12px;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: col-resize;
          z-index: 3;
        }
 
        .trim-handle-left {
          left: 0;
          border-top-left-radius: 2px;
          border-bottom-left-radius: 2px;
        }
 
        .trim-handle-right {
          right: 0;
          border-top-right-radius: 2px;
          border-bottom-right-radius: 2px;
        }
 
        .timeline-playhead-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--error-bg, #ef4444);
          z-index: 10;
          cursor: col-resize;
          pointer-events: none;
        }
 
        .playhead-head {
          position: absolute;
          top: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          background: var(--error-bg, #ef4444);
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(239, 68, 68, 0.6);
        }
 
        .snap-guide-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1.5px;
          border-left: 1.5px dashed var(--accent);
          z-index: 8;
          pointer-events: none;
          animation: pulse-guide 0.8s ease-in-out infinite;
        }
 
        @keyframes pulse-guide {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
