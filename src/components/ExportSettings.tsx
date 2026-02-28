"use client";

import { EditRecipe } from "@/lib/types";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function ExportSettings({ recipe, onChange }: Props) {
  // crf: lower = better quality, bigger file
  const label = recipe.quality <= 20 ? "High" : recipe.quality <= 24 ? "Balanced" : "Small file";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
          <SlidersHorizontal size={10} /> Quality
        </label>
        <span className="text-sm font-heading font-bold text-film-600">
          {label}
          <span className="font-normal text-xs text-[var(--muted)] ml-1">CRF {recipe.quality}</span>
        </span>
      </div>
      <input
        type="range"
        min={18}
        max={30}
        step={1}
        value={recipe.quality}
        onChange={(e) => onChange({ quality: Number(e.target.value) })}
        className="w-full accent-film-600"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--muted)]">Best quality</span>
        <span className="text-[10px] text-[var(--muted)]">Smallest file</span>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)] bg-[var(--bg)] rounded-md p-2.5 border border-[var(--border)]">
        Output will be <strong className="text-[var(--text)]">MP4 (H.264)</strong>, falling back to WebM if unsupported.
      </p>
    </div>
  );
}
