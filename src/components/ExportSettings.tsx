"use client";

import { EditRecipe } from "@/lib/types";
<<<<<<< HEAD
import { COMPRESSION_MODE_OPTIONS } from "@/lib/constants";
=======
>>>>>>> origin/main
import { cn } from "@/lib/utils";
import { SlidersHorizontal, Info as InfoIcon } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function ExportSettings({ recipe, onChange }: Props) {
  const label = recipe.quality <= 21
    ? "High"
    : recipe.quality <= 25
    ? "Balanced"
    : "Small file";
  const activeProfile = COMPRESSION_MODE_OPTIONS.find(
    (option) => option.id === recipe.compressionMode
  );
  const displayLabel = activeProfile?.label ?? "Custom";

  return (
<<<<<<< HEAD
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
            Smart compression
          </span>
          <span className="text-xs font-heading font-bold text-film-600">
            {displayLabel}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {COMPRESSION_MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onChange({
                  compressionMode: option.id,
                  quality: option.quality,
                })
              }
              className={cn(
                "rounded-lg border px-2.5 py-2 text-left transition-all",
                recipe.compressionMode === option.id
                  ? "border-film-500 bg-film-50 text-film-700"
                  : "border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-film-300"
              )}
              aria-pressed={recipe.compressionMode === option.id}
            >
              <span className="block text-xs font-heading font-bold">
                {option.label}
              </span>
              <span className="block text-[10px] text-[var(--muted)]">
                CRF {option.quality}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
=======
  <>
    <div>
>>>>>>> origin/main
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="quality-control" className="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
          <SlidersHorizontal size={10} /> Quality
          <span className="cursor-help" title="CRF (Constant Rate Factor): lower = higher quality, larger file. 18 = best quality, 30 = smallest file.">
            <InfoIcon size={14} />
          </span>
        </label>
        <span className="text-sm font-heading font-bold text-film-600">
<<<<<<< HEAD
          {recipe.compressionMode === "custom" ? "Custom" : label}
          <span className="font-normal text-xs text-[var(--muted)] ml-1">CRF {recipe.quality}</span>
=======
          {label}
          <span className="font-normal text-sm text-[var(--muted)] ml-2">CRF {recipe.quality}</span>
>>>>>>> origin/main
        </span>
      </div>
      <input
        id="quality-control"
        type="range"
        min={18}
        max={30}
        step={1}
        value={recipe.quality}
<<<<<<< HEAD
        onChange={(e) =>
          onChange({
            quality: Number(e.target.value),
            compressionMode: "custom",
          })
        }
=======
        onChange={(e) => onChange({ quality: Number(e.target.value) })}
        aria-describedby="quality-description"
>>>>>>> origin/main
        aria-label="Video export quality (CRF)"
        aria-valuetext={`${label} quality, CRF value ${recipe.quality}`}
        className="w-full accent-film-600 cursor-pointer"
      />
      <div id="quality-description" className="flex justify-between mt-1">
        <span className="text-sm text-[var(--muted)]">Best quality</span>
        <span className="text-sm text-[var(--muted)]">Smallest file</span>
      </div>
      <div className="flex items-center justify-between mt-4">
        <label htmlFor="sound-on-completion" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
          Sound on completion
        </label>

        <input
          id="sound-on-completion"
          type="checkbox"
          checked={recipe.soundOnCompletion}
          onChange={(e) =>
            onChange({
              soundOnCompletion: e.target.checked,
            })
          }
        />
      </div>
      </div>
    </div>
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="stabilization-toggle" className="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
          <SlidersHorizontal size={10} /> Stabilization
        </label>
         <span className="flex text-sm font-heading font-bold text-film-600">
          <input
            id="stabilization-toggle"
            type="checkbox"
            checked={recipe.stabilization}
            onChange={(e) =>onChange({ stabilization: e.target.checked })}
            aria-label="Enable video stabilization"
            aria-checked={recipe.stabilization}
            className="w-full accent-film-600 cursor-pointer"
          />
          {/* <span className="font-normal text-sm text-[var(--muted)] ml-2">deshake</span> */}
        </span>
      </div>

      <div className="flex justify-end">
        <span className={cn("text-sm", recipe.stabilization ? "text-red-700" : "text-[var(--muted)]")}>Note: significantly increases processing time.</span>
      </div>
    </div>
  </>
  );
}