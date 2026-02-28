"use client";

import { EditRecipe } from "@/lib/types";
import { Scissors } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function TrimControl({ recipe, onChange }: Props) {
  const handleStart = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    onChange({ trimStart: n });
  };

  const handleEnd = (val: string) => {
    if (val === "") { onChange({ trimEnd: null }); return; }
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0 || n <= recipe.trimStart) return;
    onChange({ trimEnd: n });
  };

  const inputClass =
    "w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 text-[var(--text)]";

  const labelClass =
    "text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5 flex items-center gap-1";

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className={labelClass}>
          <Scissors size={10} />
          Start (sec)
        </label>
        <input
          type="number"
          min={0}
          step={0.1}
          value={recipe.trimStart}
          onChange={(e) => handleStart(e.target.value)}
          className={inputClass}
          placeholder="0"
        />
      </div>
      <div className="flex-1">
        <label className={labelClass}>
          End (sec)
        </label>
        <input
          type="number"
          min={0}
          step={0.1}
          value={recipe.trimEnd ?? ""}
          onChange={(e) => handleEnd(e.target.value)}
          className={inputClass}
          placeholder="full video"
        />
      </div>
    </div>
  );
}
