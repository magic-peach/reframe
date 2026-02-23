"use client";

import { EditRecipe } from "@/lib/types";
import { Sliders } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function ExportSettings({ recipe, onChange }: Props) {
  // crf: lower = better quality, bigger file. 18 is great, 30 is small but kinda bad
  const qualityLabel =
    recipe.quality <= 20 ? "High" : recipe.quality <= 24 ? "Balanced" : "Small file";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-gray-500 flex items-center gap-1">
          <Sliders size={12} /> Quality
        </label>
        <span className="text-sm font-semibold text-violet-600">
          {qualityLabel} <span className="text-gray-400 font-normal text-xs">(CRF {recipe.quality})</span>
        </span>
      </div>
      <input
        type="range"
        min={18}
        max={30}
        step={1}
        value={recipe.quality}
        onChange={(e) => onChange({ quality: Number(e.target.value) })}
        className="w-full accent-violet-500"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">Best quality</span>
        <span className="text-[10px] text-gray-400">Smallest size</span>
      </div>

      {/* let the user know what format to expect */}
      <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg p-2.5">
        📦 Output will be <strong>MP4 (H.264)</strong>, falling back to WebM if unsupported.
      </p>
    </div>
  );
}
