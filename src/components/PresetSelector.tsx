"use client";

import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function PresetSelector({ recipe, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChange({ preset: preset.id })}
            className={`
              flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all
              ${recipe.preset === preset.id
                ? "border-violet-500 bg-violet-50 shadow-sm"
                : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
              }
            `}
          >
            <span className="text-lg">{preset.icon}</span>
            <span className="text-xs font-semibold text-gray-800 leading-tight">
              {preset.label}
            </span>
            <span className="text-[10px] text-gray-400">{preset.description}</span>
          </button>
        ))}
      </div>

      {/* Custom dimension inputs — only shown when custom is selected */}
      {recipe.preset === "custom" && (
        <div className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Width (px)</label>
            <input
              type="number"
              min={16}
              max={7680}
              step={2}
              value={recipe.customWidth}
              onChange={(e) => onChange({ customWidth: Number(e.target.value) })}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <span className="text-gray-400 mt-4">×</span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Height (px)</label>
            <input
              type="number"
              min={16}
              max={7680}
              step={2}
              value={recipe.customHeight}
              onChange={(e) => onChange({ customHeight: Number(e.target.value) })}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}
