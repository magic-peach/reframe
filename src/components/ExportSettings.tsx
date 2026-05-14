"use client";

import { EditRecipe } from "@/lib/types";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function ExportSettings({ recipe, onChange }: Props) {
  const label = recipe.quality <= 20 ? "High" : recipe.quality <= 24 ? "Balanced" : "Small file";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {/* Added htmlFor to link label to input */}
        <label 
          htmlFor="quality-slider" 
          className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1"
        >
          <SlidersHorizontal size={10} /> Quality
        </label>
        <span className="text-sm font-heading font-bold text-film-600">
          {label}
          <span className="font-normal text-xs text-[var(--muted)] ml-1">CRF {recipe.quality}</span>
        </span>
      </div>
      <input
        id="quality-slider" // 👈 Added ID here
        type="range"
        min={18}
        max={30}
        step={1}
        value={recipe.quality}
        onChange={(e) => onChange({ quality: Number(e.target.value) })}
        className="w-full accent-film-600 cursor-pointer focus:ring-2 focus:ring-film-400 focus:outline-none rounded-lg" // Added focus styles
        aria-valuetext={label} // Tells screen readers "High" or "Small file" instead of just a number
      />
      <div className="flex justify-between mt-1" aria-hidden="true"> {/* Hidden from screen readers to avoid clutter */}
        <span className="text-[10px] text-[var(--muted)]">Best quality</span>
        <span className="text-[10px] text-[var(--muted)]">Smallest file</span>
      </div>
    </div>
  );
}