"use client";

import { EditRecipe } from "@/lib/types";
import { useState, useEffect, useRef, useCallback, type PointerEvent } from "react";
import { AlertCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { useAudioWaveform } from "@/hooks/useAudioWaveform";
import WaveformCanvas from "@/components/WaveformCanvas";

const MIN_CLIP_DURATION = 0.1;

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  duration: number;
  file: File | null;
  seekTo?: (time: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>; // Add this
}



export default function TrimControl({ recipe, onChange, duration, file, seekTo, videoRef}: Props) {
  const [invalidStart, setStart] = useState(false);
  const [invalidEnd, setEnd] = useState(false);
  const [startErrorMsg, setStartErrorMsg] = useState("");
  const [endErrorMsg, setEndErrorMsg] = useState("");
  const [startInput, setStartInput] = useState(recipe.trimStart.toString());
  const [draggingThumb, setDraggingThumb] = useState<"start" | "end" | null>(null);

  const { waveform, isLoading: waveformLoading } = useAudioWaveform(file);
  const hasAudio = waveform.length > 0;

  const [frames, setFrames] = useState<string[]>([]);

useEffect(() => {
  const video = videoRef.current;
  if (!video || frames.length > 0) return;

  const captureFrames = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const frameList: string[] = [];
    const steps = 10;
    
    // Temporarily ensure video is ready
    if (video.readyState < 2) await new Promise(r => video.addEventListener('loadedmetadata', r, {once: true}));

    for (let i = 0; i < steps; i++) {
      video.currentTime = (i / (steps - 1)) * video.duration;
      await new Promise(r => setTimeout(r, 150)); 
      if (ctx) {
        canvas.width = 100;
        canvas.height = 64;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frameList.push(canvas.toDataURL("image/jpeg", 0.6));
      }
    }
    setFrames(frameList);
  };

  captureFrames();
}, [videoRef, frames.length]);

  useEffect(() => {
    setStartInput(recipe.trimStart.toString());
  }, [recipe.trimStart]);

  const clipLength = (recipe.trimEnd ?? duration) - recipe.trimStart;
  const trimEndValue = recipe.trimEnd ?? duration;
  const startPercent = duration > 0 ? Math.min(100, Math.max(0, (recipe.trimStart / duration) * 100)) : 0;
  const endPercent = duration > 0 ? Math.min(100, Math.max(0, (trimEndValue / duration) * 100)) : 100;

const updateTrimFromPointer = (
    event: PointerEvent<HTMLDivElement>,
    thumb: "start" | "end",
  ) => {
    if (duration <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const newValue = percent * duration;

    if (thumb === "start") {
      handleStart(newValue.toString());
    } else {
      handleEnd(newValue.toString());
    }
    
    // NEW: Force the preview to sync immediately to the new time
    if (seekTo) {
      seekTo(newValue);
    }
  };

  const handleTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const thumb = (event.target as HTMLElement).closest("[data-thumb]")?.getAttribute("data-thumb");

    if (thumb !== "start" && thumb !== "end") {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingThumb(thumb);
    updateTrimFromPointer(event, thumb);
  };

  const handleTrackPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingThumb) {
      return;
    }

    updateTrimFromPointer(event, draggingThumb);
  };

  const handleTrackPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDraggingThumb(null);
  };

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"start" | "end" | null>(null);

  const xToSeconds = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || duration <= 0) return 0;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return parseFloat((ratio * duration).toFixed(1));
  }, [duration]);

  const applyDrag = useCallback((clientX: number) => {
    const seconds = xToSeconds(clientX);
    if (dragging.current === "start") {
      const clamped = Math.min(seconds, (recipe.trimEnd ?? duration) - 0.1);
      onChange({ trimStart: Math.max(0, clamped) });
    } else if (dragging.current === "end") {
      const clamped = Math.max(seconds, recipe.trimStart + 0.1);
      onChange({ trimEnd: Math.min(duration, clamped) });
    }
  }, [xToSeconds, duration, recipe.trimStart, recipe.trimEnd, onChange]);

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
      dragging.current = null;
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

  const handleStart = (val: string) => {
    setStartInput(val);

    if (val === "") {
      setStart(false);
      setStartErrorMsg("");
      return;
    }

    const n = parseFloat(val);

    if (isNaN(n)) {
      setStart(true);
      setStartErrorMsg("Enter a valid number.");
      return;
    }

    if (n < 0) {
      setStart(true);
      setStartErrorMsg("Start time must be 0 or greater.");
      return;
    }

    if (duration > 0 && n >= duration) {
      setStart(true);
      setStartErrorMsg(
        `Start time must be less than duration (${duration.toFixed(1)}s).`
      );
      return;
    }

    if (recipe.trimEnd !== null && n >= recipe.trimEnd - MIN_CLIP_DURATION) {
      setStart(true);
      setStartErrorMsg("Start time must be less than the end time.");
      return;
    }

    setStart(false);
    setStartErrorMsg("");
    onChange({ trimStart: n });
  };

  const handleEnd = (val: string) => {
    if (val === "") {
      onChange({ trimEnd: null });
      setEnd(false);
      return;
    }

    const n = parseFloat(val);

    if (isNaN(n)) {
      setEnd(true);
      setEndErrorMsg("Enter a valid number.");
      return;
    }

    if (n <= 0) {
      setEnd(true);
      setEndErrorMsg("End time must be greater than 0.");
      return;
    }

    if (n <= recipe.trimStart + MIN_CLIP_DURATION) {
      setEnd(true);
      setEndErrorMsg("End time must be greater than start time.");
      return;
    }

    if (duration > 0 && n > duration + 0.01) {
      setEnd(true);
      setEndErrorMsg(
        `End time cannot exceed duration (${duration.toFixed(1)}s).`,
      );
      return;
    }

    setEnd(false);
    setEndErrorMsg("");
    onChange({ trimEnd: n });
  };

  const inputClass =
    "w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 text-[var(--text)] transition-shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div id="trim-control" className="space-y-3">
      {/* Waveform — shown while loading or when file is present */}
      {/* Static Frame Strip across the Trim Bar */}
      {file && (
        <div
          className="relative w-full h-16 rounded-md overflow-hidden bg-neutral-900 touch-none border border-[var(--border)]"
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
          onPointerCancel={handleTrackPointerUp}
        >
          {/* Static Frame Strip */}
          <div className="absolute inset-0 flex h-full">
            {frames.length > 0 ? (
              frames.map((src, i) => (
                <div 
                  key={i} 
                  className="h-full flex-1 border-r border-black/20 bg-cover bg-center"
                  style={{ backgroundImage: `url(${src})` }}
                />
              ))
            ) : (
              <div className="w-full h-full animate-pulse bg-neutral-800" />
            )}
          </div>

          {/* Selection Overlay (Handles) */}
          {duration > 0 && (
            <div className="pointer-events-none absolute inset-0">
              <div 
                className="absolute top-0 h-full bg-film-400/30 border-y border-film-400" 
                style={{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }} 
              />
              <button data-thumb="start" className="pointer-events-auto absolute top-0 h-full w-3 -translate-x-1/2 bg-white shadow-lg cursor-ew-resize" style={{ left: `${startPercent}%` }} />
              <button data-thumb="end" className="pointer-events-auto absolute top-0 h-full w-3 -translate-x-1/2 bg-white shadow-lg cursor-ew-resize" style={{ left: `${endPercent}%` }} />
            </div>
          )}
        </div>
      )}
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

      {duration > 0 && (
        <p className="text-sm text-[var(--muted)] font-heading mt-1">
          Clip: {formatDuration(clipLength)} of{" "}
          {formatDuration(duration)}
        </p>
      )}
      {recipe.trimEnd !== null &&
        recipe.trimEnd - recipe.trimStart < MIN_CLIP_DURATION && (
          <p className="text-[10px] text-[var(--error)] font-heading">
            Clip must be at least 0.1 seconds long.
          </p>
      )}
    </div>
  );
}