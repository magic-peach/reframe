"use client";

import { EditRecipe } from "@/lib/types";
import { RotateCw } from "lucide-react";
import BaseButton from "./ui/BaseButton";
import { cn } from "@/lib/utils";

// Create a local type intersection so TypeScript knows 'rotate' exists on this object
type RecipeWithRotation = EditRecipe & { rotate?: number };

interface Props {
  recipe: RecipeWithRotation;
  onChange: (patch: Partial<RecipeWithRotation>) => void;
}

const ROTATIONS = [0, 90, 180, 270] as const;

export default function RotateControl({ recipe, onChange }: Props) {
  // Safe fallback to 0 if 'rotate' is undefined on the recipe state
  const currentRotation = typeof recipe.rotate === "number" ? recipe.rotate : 0;

  return (
    <div className="flex gap-2">
      {ROTATIONS.map((deg) => {
        const active = currentRotation === deg;
        return (
          <BaseButton
            type="button"
            key={deg}
            onClick={() => onChange({ rotate: deg })}
            aria-label={`Rotate video to ${deg} degrees`}
            aria-pressed={active}
            active={active}
            className="flex-1 flex flex-col items-center gap-1.5 py-3"
          >
            <RotateCw 
              size={15} 
              aria-hidden="true" 
              style={{ transform: `rotate(${deg}deg)`, transformOrigin: 'center' }} 
              className="transition-transform" 
            />
            {deg}°
          </BaseButton>
        );
      })}
    </div>
  );
}