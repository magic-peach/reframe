"use client";

import { EditRecipe } from "@/lib/types";
import { Maximize2, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPresetById } from "@/lib/presets";
import { getCenteredMaxCropBox } from "@/lib/crop-frame";
import { useEffect } from "react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function FramingControl({ recipe, onChange }: Props) {
  const outputAspectRatio =
    recipe.preset === "custom"
      ? recipe.customWidth / recipe.customHeight
      : (getPresetById(recipe.preset)?.width ?? recipe.customWidth) / (getPresetById(recipe.preset)?.height ?? recipe.customHeight);

  const centeredDefaultCropBox = getCenteredMaxCropBox(outputAspectRatio);

  // When output aspect ratio changes (preset/custom dims), keep crop box valid
  // by resetting it to the centered maximum for the new aspect ratio.
  useEffect(() => {
    if (recipe.framing !== "fill") return;
    onChange({
      cropBoxX: centeredDefaultCropBox.x,
      cropBoxY: centeredDefaultCropBox.y,
      cropBoxW: centeredDefaultCropBox.w,
      cropBoxH: centeredDefaultCropBox.h,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.preset, recipe.customWidth, recipe.customHeight]);

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

      {recipe.framing === "fill" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                cropBoxX: centeredDefaultCropBox.x,
                cropBoxY: centeredDefaultCropBox.y,
                cropBoxW: centeredDefaultCropBox.w,
                cropBoxH: centeredDefaultCropBox.h,
              })
            }
            className="flex-1 min-h-[38px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-film-300 hover:bg-film-50/30 transition-colors text-xs font-heading font-bold uppercase tracking-wider"
            title="Reset crop to centered default"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({
                cropBoxX: (1 - recipe.cropBoxW) / 2,
                cropBoxY: (1 - recipe.cropBoxH) / 2,
              })
            }
            className="flex-1 min-h-[38px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-film-300 hover:bg-film-50/30 transition-colors text-xs font-heading font-bold uppercase tracking-wider"
            title="Center crop box"
          >
            Center
          </button>
        </div>
      )}
    </div>
  );
}