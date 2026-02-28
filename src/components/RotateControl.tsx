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
      {ROTATIONS.map((deg) => {
        const active = recipe.rotate === deg;
        return (
          <button
            key={deg}
            onClick={() => onChange({ rotate: deg })}
            className={`
              flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs transition-all
              ${active
                ? "border-film-500 bg-film-50 text-film-700 font-heading font-semibold"
                : "border-[var(--border)] text-[var(--muted)] hover:border-film-300 bg-[var(--surface)]"
              }
            `}
          >
            <RotateCw size={15} style={{ transform: `rotate(${deg}deg)` }} />
            {deg}°
          </button>
        );
      })}
    </div>
  );
}
