"use client";

import { EditRecipe } from "@/lib/types";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  duration: number;
}

export default function TrimControl({ recipe, onChange, duration }: Props) {
  const handleStart = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    if (duration > 0 && n >= duration) return;
    if (recipe.trimEnd !== null && n >= recipe.trimEnd) return;
    onChange({ trimStart: n });
  };

  const handleEnd = (val: string) => {
    if (val === "") { onChange({ trimEnd: null }); return; }
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0 || n <= recipe.trimStart) return;
    if (duration > 0 && n > duration) return;
    onChange({ trimEnd: n });
  };

  const inputClass =
    "w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 text-[var(--text)] transition-shadow";

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
            Start (sec)
          </label>
          <input
            type="number"
            min={0}
            max={duration > 0 ? duration : undefined}
            step={0.1}
            value={recipe.trimStart}
            onChange={(e) => handleStart(e.target.value)}
            className={inputClass}
            placeholder="0"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
            End (sec)
          </label>
          <input
            type="number"
            min={0}
            max={duration > 0 ? duration : undefined}
            step={0.1}
            value={recipe.trimEnd ?? ""}
            onChange={(e) => handleEnd(e.target.value)}
            className={inputClass}
            placeholder={duration > 0 ? `${duration.toFixed(1)}` : "full length"}
          />
        </div>
      </div>
      {duration > 0 && (
        <p className="text-[10px] text-[var(--muted)] font-heading">
          Duration: {duration.toFixed(1)}s
        </p>
      )}
    </div>
  );
}
