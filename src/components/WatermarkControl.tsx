"use client";

import { EditRecipe } from "@/lib/types";


interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

const POSITIONS = [
  { value: "top-left",     label: "↖ Top Left" },
  { value: "top-right",    label: "↗ Top Right" },
  { value: "bottom-left",  label: "↙ Bottom Left" },
  { value: "bottom-right", label: "↘ Bottom Right" },
] as const;

export default function WatermarkControl({ recipe, onChange }: Props) {
  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>Text</span>
          {recipe.watermarkText && (
            <button
              type="button"
              onClick={() => onChange({ watermarkText: "" })}
              className="text-film-500 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <input
  type="text"
  placeholder="@yourhandle"
  maxLength={40}
  value={recipe.watermarkText ?? ""}
  onChange={(e) => onChange({ watermarkText: e.target.value })}
  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-film-500 transition-colors"
/>
      </div>

      {/* Position Toggle */}
      <div className="space-y-2">
        <span className="text-xs">Position</span>
        <div className="grid grid-cols-2 gap-1.5">
          {POSITIONS.map((pos) => (
            <button
              key={pos.value}
              type="button"
              onClick={() => onChange({ watermarkPosition: pos.value })}
              className={`text-xs py-1.5 px-2 rounded-lg border transition-colors ${
                recipe.watermarkPosition === pos.value
                  ? "bg-film-600 text-white border-film-600"
                  : "bg-[var(--bg)] border-[var(--border)] hover:border-film-400"
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>Opacity</span>
          <span className="text-film-500 font-semibold">{recipe.watermarkOpacity}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={recipe.watermarkOpacity}
          onChange={(e) => onChange({ watermarkOpacity: Number(e.target.value) })}
          className="w-full accent-film-600 cursor-pointer"
        />
        <div className="flex justify-between">
          <span className="text-[10px] text-[var(--muted)]">Subtle</span>
          <span className="text-[10px] text-[var(--muted)]">Bold</span>
        </div>
      </div>
    </div>
  );
}