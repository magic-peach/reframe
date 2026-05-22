"use client";

import { useState, useEffect } from "react";
import { EditRecipe, SPEED_STEPS } from "@/lib/types";
import { Volume2, VolumeX, Gauge, RotateCcw } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function AudioSpeedControl({ recipe, onChange }: Props) {
  const parentSpeedIndex = SPEED_STEPS.indexOf(recipe.speed as (typeof SPEED_STEPS)[number]);
  const safeParentIndex = parentSpeedIndex === -1 ? 3 : parentSpeedIndex;

  const [localSpeedIndex, setLocalSpeedIndex] = useState(safeParentIndex);

  useEffect(() => {
    setLocalSpeedIndex(safeParentIndex);
  }, [safeParentIndex]);

  const isSpeedChanged = recipe.speed !== 1;

  return (
    <div className="space-y-4">
      <button
        type="button"
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
        <span className="sr-only">
          {recipe.keepAudio ? "Turn audio off" : "Turn audio on"}
        </span>
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
            {SPEED_STEPS[localSpeedIndex]}x
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={SPEED_STEPS.length - 1}
          step={1}
          value={localSpeedIndex}
          onChange={(e) => {
            setLocalSpeedIndex(Number(e.target.value));
          }}
          onPointerUp={(e) => {
            onChange({ speed: SPEED_STEPS[Number(e.currentTarget.value)] });
          }}
          onKeyUp={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              onChange({ speed: SPEED_STEPS[Number(e.currentTarget.value)] });
            }
          }}
          className="w-full accent-film-600 cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          {SPEED_STEPS.map((s) => (
            <span key={s} className="text-[9px] text-[var(--muted)]">{s}x</span>
          ))}
        </div>
      </div>

      <div className="h-10 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onChange({ speed: 1 })}
          className={`
            flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-film-600 hover:text-film-700
            transition-all duration-300 ease-in-out
            ${isSpeedChanged 
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto delay-200" 
              : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
            }
          `}
        >
          <RotateCcw size={12} />
          Reset to default
        </button>
      </div>
    </div>
  );
}