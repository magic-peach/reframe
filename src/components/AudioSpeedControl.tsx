"use client";

import { EditRecipe, SPEED_STEPS } from "@/lib/types";
import { Volume2, VolumeX, Gauge } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function AudioSpeedControl({ recipe, onChange }: Props) {
  const speedIndex = SPEED_STEPS.indexOf(recipe.speed as (typeof SPEED_STEPS)[number]);

  const handleSpeedSlider = (idx: number) => {
    onChange({ speed: SPEED_STEPS[idx] });
  };

  return (
    <div className="space-y-4">
      {/* audio toggle */}
      <button
        onClick={() => onChange({ keepAudio: !recipe.keepAudio })}
        className={`
          w-full flex items-center gap-3 p-3 rounded-xl border transition-all
          ${recipe.keepAudio
            ? "border-violet-200 bg-violet-50 text-violet-700"
            : "border-gray-200 bg-gray-50 text-gray-400"
          }
        `}
      >
        {recipe.keepAudio ? <Volume2 size={18} /> : <VolumeX size={18} />}
        <span className="text-sm font-medium">
          {recipe.keepAudio ? "Audio on" : "Mute output"}
        </span>
      </button>

      {/* speed slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500 flex items-center gap-1">
            <Gauge size={12} /> Speed
          </label>
          <span className="text-sm font-semibold text-violet-600">
            {recipe.speed}×
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={SPEED_STEPS.length - 1}
          step={1}
          value={speedIndex === -1 ? 3 : speedIndex} // default to 1x (index 3)
          onChange={(e) => handleSpeedSlider(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between mt-1">
          {SPEED_STEPS.map((s) => (
            <span key={s} className="text-[9px] text-gray-400">{s}×</span>
          ))}
        </div>
      </div>
    </div>
  );
}
