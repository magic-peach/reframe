"use client";

import { EditRecipe, SPEED_STEPS } from "@/lib/types";
import { Volume2, VolumeX, Gauge } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function AudioSpeedControl({ recipe, onChange }: Props) {
  const speedIndex = SPEED_STEPS.indexOf(recipe.speed as (typeof SPEED_STEPS)[number]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => onChange({ keepAudio: !recipe.keepAudio })}
        className={`
          w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150
          hover:scale-[1.01] active:scale-[0.99]
          ${recipe.keepAudio
            ? "border-film-300 bg-film-50 text-film-700"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
          }
        `}
      >
        {recipe.keepAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span className="text-sm font-heading font-semibold">
          {recipe.keepAudio ? "Audio on" : "Muted"}
        </span>
      </button>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
            <Gauge size={10} /> Speed
          </label>
          <span className="text-sm font-heading font-bold text-film-600">
            {recipe.speed}x
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={SPEED_STEPS.length - 1}
          step={1}
          value={speedIndex === -1 ? 3 : speedIndex}
          onChange={(e) => onChange({ speed: SPEED_STEPS[Number(e.target.value)] })}
          className="w-full accent-film-600"
        />
        <div className="flex justify-between mt-1">
          {SPEED_STEPS.map((s) => (
            <span key={s} className="text-[9px] text-[var(--muted)]">{s}x</span>
          ))}
        </div>
      </div>
    </div>
  );
}
