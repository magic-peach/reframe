"use client";

import { EditRecipe } from "@/lib/types";
import { Maximize2, Crop, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function FramingControl({ recipe, onChange }: Props) {
  return (
    <div className="space-y-3">
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
                "flex-1 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-2 py-4 rounded-lg border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]",
                active
                  ? "border-film-500 bg-film-50 text-film-700"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-film-300 bg-[var(--surface)]"
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

      <label
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
          recipe.framing === "fill"
            ? "border-[var(--border)] bg-[var(--surface)]"
            : "border-[var(--border)] bg-[var(--border)] opacity-60"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Sparkles size={16} className="shrink-0 text-film-500" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs font-heading font-semibold uppercase tracking-wider">
              AI subject tracking
            </span>
            <span className="block text-[10px] text-[var(--muted)]">
              Pan crop for vertical fill exports
            </span>
          </span>
        </span>
        <input
          type="checkbox"
          checked={recipe.autoReframe}
          disabled={recipe.framing !== "fill"}
          onChange={(event) => onChange({
            autoReframe: event.target.checked,
            autoReframeTimeline: [],
          })}
          className="h-4 w-4 accent-film-600"
          aria-label="Enable AI subject tracking"
        />
      </label>
    </div>
  );
}
