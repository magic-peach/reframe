"use client";

import { useAudioWaveform } from "@/hooks/useAudioWaveform";
import { EditRecipe } from "@/lib/types";
import { useState } from "react";

interface Props {
  file: File | null;
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  duration: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00.0";

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  const wholeSeconds = Math.floor(remainder);
  const tenths = Math.floor((remainder - wholeSeconds) * 10);
  const paddedSeconds = String(wholeSeconds).padStart(2, "0");

  return `${minutes}:${paddedSeconds}.${tenths}`;
}

export default function TrimControl({
  file,
  recipe,
  onChange,
  duration,
}: Props) {
  const { waveform, isLoading } = useAudioWaveform(file, 48);
  const [invalidStart, setInvalidStart] = useState(false);
  const [invalidEnd, setInvalidEnd] = useState(false);

  const trimEnd =
    recipe.trimEnd ?? (duration > 0 ? duration : recipe.trimStart);
  const hasTimeline = duration > 0;

  const startPercent =
    duration > 0 ? clamp((recipe.trimStart / duration) * 100, 0, 100) : 0;

  const endPercent =
    duration > 0 ? clamp((trimEnd / duration) * 100, 0, 100) : 100;

  const selectionWidth = Math.max(0, endPercent - startPercent);

  const handleStart = (val: string) => {
    if (val === "") {
      setInvalidStart(false);
      onChange({ trimStart: 0 });
      return;
    }

    const n = parseFloat(val);

    if (isNaN(n) || n < 0) {
      setInvalidStart(true);
      return;
    }

    if (duration > 0 && n >= duration) {
      setInvalidStart(true);
      return;
    }

    if (recipe.trimEnd !== null && n >= recipe.trimEnd) {
      setInvalidStart(true);
      return;
    }

    setInvalidStart(false);
    onChange({ trimStart: n });
  };

  const handleEnd = (val: string) => {
    if (val === "") {
      onChange({ trimEnd: null });
      setInvalidEnd(false);
      return;
    }

    const n = parseFloat(val);

    if (isNaN(n) || n <= 0 || n <= recipe.trimStart) {
      setInvalidEnd(true);
      return;
    }

    if (duration > 0 && n > duration) {
      setInvalidEnd(true);
      return;
    }

    setInvalidEnd(false);
    onChange({ trimEnd: n });
  };

  const inputClass =
    "w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 text-[var(--text)] transition-shadow";

  return (
    <div className="space-y-2">
      {hasTimeline && (
        <div className="space-y-1.5">
          <div className="relative h-20 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)]">
            <svg
              viewBox="0 0 100 48"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {(waveform.length > 0
                ? waveform
                : Array.from({ length: 48 }, (_, index) =>
                    isLoading ? 0.25 + (index % 5) * 0.1 : 0.14,
                  )
              ).map((peak: number, index: number, bars: number[]) => {
                const barWidth = 100 / bars.length;
                const height = Math.max(4, peak * 40);
                const y = (48 - height) / 2;

                return (
                  <rect
                    key={index}
                    x={index * barWidth}
                    y={y}
                    width={Math.max(0.4, barWidth * 0.62)}
                    height={height}
                    rx="0.4"
                    className="fill-film-500/45"
                  />
                );
              })}
            </svg>

            <div
              className="border-film-600/80 absolute inset-y-0 border-x bg-film-500/15"
              style={{
                left: `${startPercent}%`,
                width: `${selectionWidth}%`,
              }}
            />

            <div
              className="absolute inset-y-2 w-1 rounded-full bg-film-700 shadow-sm"
              style={{ left: `${startPercent}%` }}
            />

            <div
              className="absolute inset-y-2 w-1 rounded-full bg-film-700 shadow-sm"
              style={{ left: `${endPercent}%` }}
            />
          </div>

          <div className="font-heading flex items-center justify-between text-[10px] text-[var(--muted)]">
            <span>{formatTime(recipe.trimStart)}</span>
            <span>{formatTime(trimEnd)}</span>
          </div>
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
            min={0}
            max={duration > 0 ? duration : undefined}
            step={0.1}
            value={recipe.trimStart}
            spellCheck={false}
            onChange={(e) => handleStart(e.target.value)}
            aria-label="Trim start time in seconds"
            aria-invalid={invalidStart}
            className={`${inputClass} ${
              invalidStart ? "border-red-500" : "border-[var(--border)]"
            }`}
            placeholder="0"
          />
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
            min={0}
            max={duration > 0 ? duration : undefined}
            step={0.1}
            value={recipe.trimEnd ?? ""}
            spellCheck={false}
            onChange={(e) => handleEnd(e.target.value)}
            aria-label="Trim end time in seconds"
            aria-invalid={invalidEnd}
            className={`${inputClass} ${invalidEnd ? "border-red-500" : "border-[var(--border)]"}`}
            placeholder={
              duration > 0 ? `${duration.toFixed(1)}` : "full length"
            }
          />
        </div>
      </div>

      {duration > 0 && (
        <p className="font-heading text-[10px] text-[var(--muted)]">
          Duration: {duration.toFixed(1)}s
        </p>
      )}
    </div>
  );
}
