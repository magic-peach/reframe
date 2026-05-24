"use client";

import { EditRecipe } from "@/lib/types";
import { RotateCw } from "lucide-react";
import BaseButton from "./ui/BaseButton";
import { cn } from "@/lib/utils";

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
          <BaseButton
            type="button"
            key={deg}
            onClick={() => onChange({ rotate: deg })}
            aria-label={`Rotate video to ${deg} degrees`}
            aria-pressed={active}
            active={active}
            className={cn(
              "flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs transition-all duration-300 cursor-pointer hover:-translate-y-0.5 active:scale-[0.97]",
              active
                ? "border-film-500 bg-film-50 text-film-700 font-heading font-semibold shadow-[0_0_15px_-3px_rgba(230,57,70,0.15)] ring-1 ring-film-500/20"
                : "border-[var(--border)] text-[var(--muted)] hover:border-film-300 hover:bg-film-50/30 hover:shadow-card bg-[var(--surface)] hover:text-[var(--text)]"
            )}
          >
            <RotateCw size={15} aria-hidden="true" style={{ transform: `rotate(${deg}deg)`, transformOrigin: 'center' }} className="transition-transform" />
            {deg}
          </BaseButton>
        );
      })}
    </div>
  );
}
