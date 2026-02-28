"use client";

import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import { Settings2 } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

// renders a scaled rectangle representing the aspect ratio
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
              key={preset.id}
              onClick={() => onChange({ preset: preset.id })}
              className={`
                flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                ${active
                  ? "border-film-500 bg-film-50"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
                }
              `}
            >
              <RatioBox width={preset.width} height={preset.height} active={active} />
              <div className="min-w-0">
                <p className={`text-xs font-heading font-bold leading-tight truncate ${active ? "text-film-700" : "text-[var(--text)]"}`}>
                  {preset.label}
                </p>
                <p className="text-[10px] text-[var(--muted)] leading-tight mt-0.5 truncate">
                  {preset.platform}
                </p>
              </div>
            </button>
          );
        })}

        {/* custom button */}
        <button
          onClick={() => onChange({ preset: "custom" })}
          className={`
            flex items-center gap-3 p-3 rounded-lg border text-left transition-all
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
        <div className="flex gap-3 items-center p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
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
              className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400"
            />
          </div>
          <span className="text-[var(--muted)] mt-5 font-heading text-sm">×</span>
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
              className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}
