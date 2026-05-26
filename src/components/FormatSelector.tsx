"use client";

import { EditRecipe } from "@/lib/types";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

const FORMAT_OPTIONS = [
  { id: "mp4", label: "MP4", description: "Best compatibility, smaller file size" },
  { id: "webm", label: "WebM", description: "Open format, optimized for web" },
  { id: "mkv", label: "MKV", description: "Container, maximum quality" },
  { id: "gif", label: "GIF", description: "Animated image — keep clips under 10 s" },
] as const;

export default function FormatSelector({ recipe, onChange }: Props) {
  const handleFormatSelect = (format: EditRecipe["format"]) => {
    onChange({
      format,
      ...(format === "gif" ? { keepAudio: false } : {}),
    });
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <Film size={10} className="text-film-500 opacity-80" />
        <div className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
          Output Format
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {FORMAT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleFormatSelect(option.id)}
            aria-label={`Select ${option.label} format`}
            aria-pressed={recipe.format === option.id}
            className={cn(
              "relative px-3 py-3 rounded-lg border transition-all min-h-12",
              "text-xs font-heading font-semibold uppercase tracking-wider",
              "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0",
              recipe.format === option.id
                ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text)] shadow-[inset_0_0_0_1px_var(--accent)]"
                : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)] active:scale-[0.98]"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-[var(--muted)] mt-2">
        {FORMAT_OPTIONS.find((o) => o.id === recipe.format)?.description}
      </p>
    </div>
  );
}
