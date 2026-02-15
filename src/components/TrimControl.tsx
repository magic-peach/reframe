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
    if (val === "") {
      onChange({ trimEnd: null });
      return;
    }
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0) return;
    // end must be after start
    if (n <= recipe.trimStart) return;
    onChange({ trimEnd: n });
  };

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="text-xs text-gray-500 block mb-1.5 flex items-center gap-1">
          <Scissors size={12} /> Start (sec)
        </label>
        <input
          type="number"
          min={0}
          step={0.1}
          value={recipe.trimStart}
          onChange={(e) => handleStart(e.target.value)}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
          placeholder="0"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-500 block mb-1.5">End (sec)</label>
        <input
          type="number"
          min={0}
          step={0.1}
          value={recipe.trimEnd ?? ""}
          onChange={(e) => handleEnd(e.target.value)}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
          placeholder="leave blank = full"
        />
      </div>
    </div>
  );
}
