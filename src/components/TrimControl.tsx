"use client";

import { EditRecipe } from "@/lib/types";
import { useState } from "react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  duration: number;
}

export default function TrimControl({ recipe, onChange, duration }: Props) {
  const [invalidStart, setStart] = useState(false);
  const [invalidEnd, setEnd] = useState(false);

  const handleStart = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) {
      setStart(true);
      return;
    }
    if (duration > 0 && n >= duration) {
      setStart(true);
      return;
    }
    if (recipe.trimEnd !== null && n >= recipe.trimEnd) {
      setStart(true);
      return;
    };
    setStart(false);
    onChange({ trimStart: n });
  };

  const handleEnd = (val: string) => {
    if (val === "") {
      setEnd(false);
      onChange({ trimEnd: null });
      return;
    }
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0 || n <= recipe.trimStart) {
      setEnd(true);
      return;
    }
    if (duration > 0 && n > duration) {
      setEnd(true);
      return;
    }
    setEnd(false);
    onChange({ trimEnd: n });
  };

  const inputClass =
    "w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 text-[var(--text)] transition-shadow";

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="trim-start" className="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-2">
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
              invalidStart ? "border-red-500" : "border-[var(--border)]"}`}
            placeholder="0"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="trim-end" className="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-2">
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
            className={`${inputClass} ${
              invalidEnd ? "border-red-500" : "border-[var(--border)]"}`}
            placeholder={duration > 0 ? `${duration.toFixed(1)}` : "full length"}
          />
        </div>
      </div>
      {duration > 0 && (
        <p className="text-sm text-[var(--muted)] font-heading mt-1">
          Duration: {duration.toFixed(1)}s
        </p>
      )}
    </div>
  );
}
