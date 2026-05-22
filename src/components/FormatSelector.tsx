"use client";

import { EditRecipe } from "@/lib/types";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";

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

const FORMAT_TOOLTIPS: Record<(typeof FORMAT_OPTIONS)[number]["id"], string> = {
  mp4: "MP4 (H.264): Best compatibility across devices and social platforms.",
  webm: "WebM: Optimized for web playback with efficient compression.",
  mkv: "MKV: Flexible container format, good for archival quality.",
  gif: "GIF: Animated image format. Keep clips under 10 seconds for best results.",
};

export default function FormatSelector({ recipe, onChange }: Props) {
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
          <Tooltip
            key={option.id}
            block
            content={FORMAT_TOOLTIPS[option.id]}
          >
            <button
              type="button"
              onClick={() => onChange({ format: option.id as "mp4" | "webm" | "mkv" | "gif" })}
              aria-label={`Select ${option.label} format`}
              aria-pressed={recipe.format === option.id}
              className={cn(
                "relative w-full px-3 py-2.5 rounded-lg border-2 transition-all",
                "text-xs font-heading font-semibold uppercase tracking-wider",
                recipe.format === option.id
                  ? "border-film-600 bg-film-50 text-film-600"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-film-400 hover:text-film-600"
              )}
            >
              {option.label}
            </button>
          </Tooltip>
        ))}
      </div>
      <p className="text-[10px] text-[var(--muted)] mt-2">
        {FORMAT_OPTIONS.find((o) => o.id === recipe.format)?.description}
      </p>
    </div>
  );
}