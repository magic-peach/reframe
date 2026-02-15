"use client";

import { EditRecipe } from "@/lib/types";
import { RotateCw } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

const ROTATIONS = [0, 90, 180, 270] as const;

export default function RotateControl({ recipe, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {ROTATIONS.map((deg) => (
        <button
          key={deg}
          onClick={() => onChange({ rotate: deg })}
          className={`
            flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm transition-all
            ${recipe.rotate === deg
              ? "border-violet-500 bg-violet-50 text-violet-700 font-semibold"
              : "border-gray-200 text-gray-500 hover:border-violet-300"
            }
          `}
        >
          <RotateCw
            size={16}
            style={{ transform: `rotate(${deg}deg)` }}
          />
          {deg}°
        </button>
      ))}
    </div>
  );
}
