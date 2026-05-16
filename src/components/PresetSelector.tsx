"use client";

import { useRef } from "react";
import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import { Settings2, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

// Fixed to handle 0 values safely
function getOrientationLabel(width: number, height: number): string {
  if (!width || !height) return "Custom";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  const ratio = `${width / d}:${height / d}`;
  const orientation =
    width === height ? "Square" : width > height ? "Landscape" : "Portrait";
  return `${orientation} (${ratio})`;
}

function RatioBox({
  width,
  height,
  active,
}: {
  width: number;
  height: number;
  active: boolean;
}) {
  const MAX = 32;
  const ratio = width / height;
  const [w, h] =
    ratio >= 1
      ? [MAX, Math.max(4, Math.round(MAX / ratio))]
      : [Math.max(4, Math.round(MAX * ratio)), MAX];

  return (
    <div
      className={cn(
        "border-2 flex-shrink-0 transition-colors rounded-sm",
        active ? "border-film-600" : "border-[var(--muted)] opacity-60",
      )}
      style={{ width: w, height: h }}
    />
  );
}

const groupedPresets = {
  Social: PRESETS.filter((p) =>
    ["vertical-9-16", "instagram-4-5", "square-1-1"].includes(p.id),
  ),
  Video: PRESETS.filter((p) =>
    ["landscape-16-9", "twitter-hd", "ultrawide-21-9"].includes(p.id),
  ),
  Cinema: PRESETS.filter((p) => ["cinema-scope", "dci-2k"].includes(p.id)),
  Other: PRESETS.filter((p) =>
    ["instagram-panoramic", "portrait-3-4"].includes(p.id),
  ),
};

export default function PresetSelector({ recipe, onChange }: Props) {
  const presetRefs = useRef<Record<string, (HTMLButtonElement | null)[]>>({});

const handleArrowNavigation = (
    e: React.KeyboardEvent,
    category: string,
    index: number,
  ) => {
    const items = presetRefs.current[category];
    if (!items) return;

    // Define the vertical order of your sections so it knows where to jump
    const allCategories = [...Object.keys(groupedPresets), "Custom"];
    const currentCatIndex = allCategories.indexOf(category);

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        items[index + 1]?.focus();
        break;

      case "ArrowLeft":
        e.preventDefault();
        items[index - 1]?.focus();
        break;

      case "ArrowDown": {
        e.preventDefault();
        const nextCat = allCategories[currentCatIndex + 1];
        if (nextCat && presetRefs.current[nextCat]) {
          // Jump to next category, trying to match the same column index
          const nextItems = presetRefs.current[nextCat];
          const targetIndex = Math.min(index, nextItems.length - 1);
          nextItems[targetIndex]?.focus();
        }
        break;
      }

      case "ArrowUp": {
        e.preventDefault();
        const prevCat = allCategories[currentCatIndex - 1];
        if (prevCat && presetRefs.current[prevCat]) {
          // Jump to previous category, trying to match the same column index
          const prevItems = presetRefs.current[prevCat];
          const targetIndex = Math.min(index, prevItems.length - 1);
          prevItems[targetIndex]?.focus();
        }
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedPresets).map(([category, presets]) => {
        if (presets.length === 0) return null; // Skip empty categories

        return (
          <div key={category} className="space-y-3">
            <h2
              aria-label={`${category} presets`}
              className="text-xs font-bold text-[var(--muted)] px-1 uppercase tracking-wider"
            >
              {category}
            </h2>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {presets.map((preset, index) => {
                const active = recipe.preset === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    ref={(el) => {
                      if (!presetRefs.current[category]) {
                        presetRefs.current[category] = [];
                      }
                      presetRefs.current[category][index] = el;
                    }}
                    onKeyDown={(e) => handleArrowNavigation(e, category, index)}
                    onClick={() => onChange({ preset: preset.id })}
                    title={`${preset.label} — ${preset.width}×${preset.height} (${getOrientationLabel(preset.width, preset.height)})`}
                    className={cn(
                      "flex items-center gap-2.5 p-1.5 rounded-lg border text-left transition-all duration-150 cursor-pointer",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      active
                        ? "border-film-500 bg-film-50 ring-1 ring-film-500/20"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30",
                    )}
                  >
                    <RatioBox
                      width={preset.width}
                      height={preset.height}
                      active={active}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-heading font-bold leading-tight truncate",
                          active ? "text-film-700" : "text-[var(--text)]",
                        )}
                      >
                        {preset.label}
                      </p>

                      <p className="text-[10px] text-[var(--muted)] leading-tight mt-0.5 truncate">
                        {preset.platform}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Custom Dimension Section */}
      <div className="space-y-3 pt-2 border-t border-[var(--border)]">
        <h2 className="text-xs font-bold text-[var(--muted)] px-1 uppercase tracking-wider">
          Custom Dimensions
        </h2>
        
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            title="Custom — Set your own dimensions"
            onClick={() => onChange({ preset: "custom" })}
            className={cn(
              "flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150",
              "hover:scale-[1.02] active:scale-[0.98]",
              recipe.preset === "custom"
                ? "border-film-500 bg-film-50 ring-1 ring-film-500/20"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30",
            )}
          >
            <Settings2
              size={20}
              className={cn(
                "shrink-0",
                recipe.preset === "custom"
                  ? "text-film-600"
                  : "text-[var(--muted)]",
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-heading font-bold",
                  recipe.preset === "custom"
                    ? "text-film-700"
                    : "text-[var(--text)]",
                )}
              >
                Custom
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                Set your own
              </p>
            </div>
          </button>
        </div>

        {recipe.preset === "custom" && (
          <div className="flex gap-4 items-center p-4 mt-2 bg-[var(--surface)] rounded-lg border border-film-200 animate-fade-in shadow-sm">
            <div className="flex-1">
              <label
                htmlFor="custom-width"
                className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5"
              >
                Width (px)
              </label>
              <input
                id="custom-width"
                type="number"
                min={16}
                max={7680}
                step={2}
                value={recipe.customWidth}
                onChange={(e) =>
                  onChange({ customWidth: Number(e.target.value) })
                }
                className="w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex flex-col items-center justify-center mt-5">
              <span className="text-[var(--muted)] font-heading text-sm font-medium">
                ×
              </span>
            </div>

            <div className="flex-1">
              <label
                htmlFor="custom-height"
                className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5"
              >
                Height (px)
              </label>
              <input
                id="custom-height"
                type="number"
                min={16}
                max={7680}
                step={2}
                value={recipe.customHeight}
                onChange={(e) =>
                  onChange({ customHeight: Number(e.target.value) })
                }
                className="w-full text-sm px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Real-time aspect ratio calculation badge */}
            <div className="hidden sm:flex flex-col justify-end h-full ml-2">
              <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5 text-center">
                Ratio
              </span>
              <div className="h-[38px] flex items-center px-3 bg-[var(--bg)] border border-[var(--border)] rounded-md text-xs font-medium text-film-700">
                {getOrientationLabel(recipe.customWidth || 0, recipe.customHeight || 0)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}