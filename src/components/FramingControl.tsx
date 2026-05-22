"use client";

import { EditRecipe } from "@/lib/types";
import { Maximize2, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";

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
          <Tooltip
            key={mode}
            block
            wrapperClassName="flex-1 min-w-0"
            content={
              mode === "fit"
                ? "Fit keeps the whole video visible. Adds letterbox bars if needed."
                : "Fill crops the video to match the target size. Edges may be cut off."
            }
          >
            <button
              type="button"
              onClick={() => onChange({ framing: mode })}
              aria-label={`Set framing to ${mode}`}
              aria-pressed={active}
              className={cn(
                "flex-1 min-h-[44px] min-w-[44px] w-full flex flex-col items-center justify-center gap-2 py-4 rounded-lg border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]",
                active
                  ? "border-film-500 bg-film-50 text-film-700"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-film-300 bg-[var(--surface)]"
              )}
            >
              <Icon size={18} aria-hidden="true" />
              <div className="text-center">
                <p className="text-xs font-heading font-semibold uppercase tracking-wider">
                  {mode === "fit" ? "Fit" : "Fill"}
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">
                  {mode === "fit" ? "Letterbox / pillarbox" : "Crop to frame"}
                </p>
              </div>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}