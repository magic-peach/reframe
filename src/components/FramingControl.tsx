"use client";

import { EditRecipe } from "@/lib/types";
import { Maximize2, Crop } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function FramingControl({ recipe, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {(["fit", "fill"] as const).map((mode) => {
        const Icon = mode === "fit" ? Maximize2 : Crop;
        const active = recipe.framing === mode;
        return (
          <button
            key={mode}
            onClick={() => onChange({ framing: mode })}
            className={`
              flex-1 flex flex-col items-center gap-2 py-4 rounded-lg border transition-all duration-150
              hover:scale-[1.02] active:scale-[0.98]
              ${active
                ? "border-film-500 bg-film-50 text-film-700"
                : "border-[var(--border)] text-[var(--muted)] hover:border-film-300 bg-[var(--surface)]"
              }
            `}
          >
            <Icon size={18} />
            <div className="text-center">
              <p className="text-xs font-heading font-semibold uppercase tracking-wider">
                {mode === "fit" ? "Fit" : "Fill"}
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                {mode === "fit" ? "Letterbox / pillarbox" : "Crop to frame"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
