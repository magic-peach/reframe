"use client";

import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import { Settings2 } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

function RatioBox({ width, height, active }: { width: number; height: number; active: boolean }) {
  const MAX = 32;
  const ratio = width / height;
  const [w, h] = ratio >= 1
    ? [MAX, Math.max(4, Math.round(MAX / ratio))]
    : [Math.max(4, Math.round(MAX * ratio)), MAX];

  return (
    <div
      className={`border-2 flex-shrink-0 transition-colors ${
        active ? "border-film-600" : "border-[var(--muted)] opacity-60"
      }`}
      style={{ width: w, height: h }}
    />
  );
}

export default function PresetSelector({ recipe, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {PRESETS.filter((p) => p.id !== "custom").map((preset) => {
          const active = recipe.preset === preset.id;
          return (
            <button
              type="button"
              key={preset.id}
              onClick={() => onChange({ preset: preset.id })}
              title={`${preset.label} — ${preset.platform}`}
              className={`
                flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150
                hover:scale-[1.02] active:scale-[0.98]
                ${active
                  ? "border-film-500 bg-film-50"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
                }
              `}
            >
              <RatioBox width={preset.width} height={preset.height} active={active} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-heading font-bold leading-tight ${active ? "text-film-700" : "text-[var(--text)]"}`}>
                  {preset.label}
                </p>
                <p className="text-[10px] text-[var(--muted)] leading-tight mt-0.5 truncate">
                  {preset.platform}
                </p>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onChange({ preset: "custom" })}
          className={`
            flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150
            hover:scale-[1.02] active:scale-[0.98]
            ${recipe.preset === "custom"
              ? "border-film-500 bg-film-50"
              : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
            }
          `}
        >
          <Settings2
            size={20}
            className={`shrink-0 ${recipe.preset === "custom" ? "text-film-600" : "text-[var(--muted)]"}`}
          />
          <div className="min-w-0">
            <p className={`text-xs font-heading font-bold ${recipe.preset === "custom" ? "text-film-700" : "text-[var(--text)]"}`}>
              Custom
            </p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">Set your own</p>
          </div>
        </button>
      </div>

      {recipe.preset === "custom" && (
        <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] animate-fade-in">
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                Width px
              </label>
              <input
                type="number"
                min={16}
                max={7680}
                step={2}
                value={recipe.customWidth}
                onChange={(e) => onChange({ customWidth: Number(e.target.value) })}
                className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 transition-shadow"
              />
            </div>
            <span className="text-[var(--muted)] mt-5 font-heading text-sm">x</span>
            <div className="flex-1">
              <label className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                Height px
              </label>
              <input
                type="number"
                min={16}
                max={7680}
                step={2}
                value={recipe.customHeight}
                onChange={(e) => onChange({ customHeight: Number(e.target.value) })}
                className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 transition-shadow"
              />
            </div>
          </div>
          {recipe.customWidth > 0 && recipe.customHeight > 0 && (
            <div className="w-full mt-2 text-center">
              <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
                Aspect ratio:{" "}
              </span>
              <span className="text-[10px] font-heading font-bold text-film-600">
                {(() => {
                  const gcd = (a: number, b: number): number =>
                    b === 0 ? a : gcd(b, a % b);
                  const g = gcd(recipe.customWidth, recipe.customHeight);
                  return `${recipe.customWidth / g}:${recipe.customHeight / g}`;
                })()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
