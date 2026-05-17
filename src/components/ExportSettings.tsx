"use client";

import { EditRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Info, ShieldCheck } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function ExportSettings({ recipe, onChange }: Props) {
  const label =
    recipe.quality <= 21
      ? "High quality"
      : recipe.quality <= 25
      ? "Balanced"
      : "Small file";

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <label htmlFor="quality-control" className="text-sm font-medium text-[var(--text)]">
            Quality
          </label>
          <div className="text-right">
            <p className="text-sm font-semibold text-[var(--film-700)]">{label}</p>
            <p className="text-xs text-[var(--muted)]">CRF {recipe.quality}</p>
          </div>
        </div>

        <input
          id="quality-control"
          type="range"
          min={18}
          max={30}
          step={1}
          value={recipe.quality}
          onChange={(e) => onChange({ quality: Number(e.target.value) })}
          aria-label="Video export quality"
          aria-valuetext={`${label}, CRF value ${recipe.quality}`}
          className="h-8 w-full cursor-pointer"
        />

        <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
          <span>Best quality</span>
          <span>Smallest file</span>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
          <Info size={14} className="mt-0.5 shrink-0" />
          Lower CRF keeps more detail and usually creates a larger file.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
        <label
          htmlFor="stabilization-toggle"
          className="flex cursor-pointer items-start justify-between gap-4"
        >
          <span className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface)] text-[var(--film-600)]">
              <ShieldCheck size={16} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--text)]">
                Stabilization
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                Smooth shaky footage. This can significantly increase processing time.
              </span>
            </span>
          </span>

          <input
            id="stabilization-toggle"
            type="checkbox"
            checked={recipe.stabilization}
            onChange={(e) => onChange({ stabilization: e.target.checked })}
            className={cn(
              "mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-[var(--border)]",
              "accent-[var(--accent)]"
            )}
          />
        </label>
      </div>
    </div>
  );
}
