"use client";

import { EditRecipe } from "@/lib/types";
import { SlidersHorizontal } from "lucide-react";

const OUTPUT_FORMATS = [
  { value: "mp4", label: "MP4" },
  { value: "webm", label: "WebM" },
  { value: "mkv", label: "MKV" },
] as const;

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function ExportSettings({ recipe, onChange }: Props) {
  const label = recipe.quality <= 21 
    ? "High" 
    : recipe.quality <= 25 
    ? "Balanced" 
    : "Small file";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="quality-control" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
          <SlidersHorizontal size={10} /> Quality
        </label>
        <span className="text-sm font-heading font-bold text-film-600">
          {label}
          <span className="font-normal text-xs text-[var(--muted)] ml-1">CRF {recipe.quality}</span>
        </span>
      </div>
      <input
        id="quality-control"
        type="range"
        min={18}
        max={30}
        step={1}
        value={recipe.quality}
        onChange={(e) => onChange({ quality: Number(e.target.value) })}
        aria-label="Video export quality (CRF)"
        aria-valuetext={`${label} quality, CRF value ${recipe.quality}`}
        className="w-full accent-film-600 cursor-pointer"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--muted)]">Best quality</span>
        <span className="text-[10px] text-[var(--muted)]">Smallest file</span>
      </div>

      <div className="mt-5">
        <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1 mb-2">
          <SlidersHorizontal size={10} /> Output format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {OUTPUT_FORMATS.map((format) => {
            const active = recipe.format === format.value;

            return (
              <button
                key={format.value}
                type="button"
                onClick={() => onChange({ format: format.value })}
                className={`rounded-lg border px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide transition-colors ${
                  active
                    ? "bg-film-600 border-film-600 text-white"
                    : "bg-[var(--bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
                }`}
              >
                {format.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
