"use client";

import { EditRecipe } from "@/lib/types";
import { Maximize2, Crop } from "lucide-react";
import { cn } from "@/lib/utils";

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
            type="button"
            key={mode}
            title={mode === "fit" ? "Fit: Adds black bars (letterbox) to fill empty space" : "Fill: Crops the video to fill the entire frame"}
            onClick={() => onChange({ framing: mode })}
            className={cn(
              "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg transition-all duration-300 hover:scale-[1.03] hover:border-blue-400 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]",
              active && "border-purple-400 bg-gradient-to-r from-purple-600/20 to-blue-600/20"
            )}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="sr-only">
              Set framing to {mode === "fit" ? "fit within frame" : "fill frame by cropping"}
            </span>
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