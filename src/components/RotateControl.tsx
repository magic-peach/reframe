"use client";

import { EditRecipe } from "@/lib/types";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

const ROTATIONS = [0, 90, 180, 270] as const;

export default function RotateControl({ recipe, onChange }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = ROTATIONS.indexOf(recipe.rotate as typeof ROTATIONS[number]);

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % ROTATIONS.length;
      onChange({ rotate: ROTATIONS[nextIndex] });
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + ROTATIONS.length) % ROTATIONS.length;
      onChange({ rotate: ROTATIONS[prevIndex] });
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Rotation"
      className="flex gap-2"
      onKeyDown={handleKeyDown}
    >
      {ROTATIONS.map((deg) => {
        const active = recipe.rotate === deg;
        return (
          <button
            type="button"
            key={deg}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange({ rotate: deg })}
            aria-label={`Rotate video to ${deg} degrees`}
            aria-pressed={active}
            className={cn(
              "flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border text-xs transition-all duration-150 cursor-pointer hover:scale-[1.03] active:scale-[0.97]",
              active
                ? "border-film-500 bg-film-50 text-film-700 font-heading font-semibold"
                : "border-[var(--border)] text-[var(--muted)] hover:border-film-300 bg-[var(--surface)]"
            )}
          >
            <RotateCw size={15} style={{ transform: `rotate(${deg}deg)`, transformOrigin: 'center' }} className="transition-transform" />
            <span className="sr-only">Rotate video to {deg} degrees</span>
            {deg}°
          </button>
        );
      })}
    </div>
  );
}