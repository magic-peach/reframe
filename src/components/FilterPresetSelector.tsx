"use client";

import { EditRecipe } from "@/lib/types";
import { VIDEO_FILTERS } from "@/lib/videoFilters";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

export default function FilterPresetSelector({
  recipe,
  onChange,
}: Props) {
  return (
    <div>
      <div className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
        Video Filter
      </div>

      <div className="grid grid-cols-2 gap-2">
        {VIDEO_FILTERS.map((filter) => {
          const active = recipe.filterPreset === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() =>
                onChange({ filterPreset: filter.id })
              }
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-heading font-semibold transition-all",
                active
                  ? "border-film-600 bg-film-50 text-film-700"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-film-400"
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}