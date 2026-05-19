"use client";

import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import PresetSelector from "./PresetSelector";
import { Layers, SquareStack } from "lucide-react";

interface Props {
  recipe: EditRecipe;
  onRecipeChange: (patch: Partial<EditRecipe>) => void;
  batchMode: boolean;
  onBatchModeChange: (enabled: boolean) => void;
  batchPresetIds: string[];
  onToggleBatchPreset: (presetId: string) => void;
}

export default function BatchExportPanel({
  recipe,
  onRecipeChange,
  batchMode,
  onBatchModeChange,
  batchPresetIds,
  onToggleBatchPreset,
}: Props) {
  const selectable = PRESETS.filter((p) => p.id !== "custom");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-2 min-w-0">
          <SquareStack size={18} className="text-film-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-heading font-bold text-[var(--text)]">Batch export</p>
            <p className="text-[10px] text-[var(--muted)] leading-tight mt-0.5">
              Export the same edit to multiple sizes, one after another.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={batchMode}
          onClick={() => onBatchModeChange(!batchMode)}
          className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
            batchMode ? "bg-film-600" : "bg-[var(--border)]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              batchMode ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {!batchMode ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-film-500 opacity-80">
              <Layers size={12} />
            </span>
            <h3 className="text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
              Output size
            </h3>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <PresetSelector recipe={recipe} onChange={onRecipeChange} />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
            Select presets (2+)
          </p>
          <div className="grid grid-cols-1 gap-1.5 max-h-[280px] overflow-y-auto pr-0.5">
            {selectable.map((preset) => {
              const checked = batchPresetIds.includes(preset.id);
              return (
                <label
                  key={preset.id}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all duration-150
                    ${checked
                      ? "border-film-500 bg-film-50"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleBatchPreset(preset.id)}
                    className="w-4 h-4 rounded border-[var(--border)] text-film-600 focus:ring-film-400"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-heading font-bold leading-tight ${checked ? "text-film-700" : "text-[var(--text)]"}`}>
                      {preset.label}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] leading-tight mt-0.5 truncate">
                      {preset.platform} · {preset.width}×{preset.height}
                    </p>
                  </div>
                </label>
              );
            })}

            <label
              className={`
                flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all duration-150
                ${batchPresetIds.includes("custom")
                  ? "border-film-500 bg-film-50"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
                }
              `}
            >
              <input
                type="checkbox"
                checked={batchPresetIds.includes("custom")}
                onChange={() => onToggleBatchPreset("custom")}
                className="w-4 h-4 rounded border-[var(--border)] text-film-600 focus:ring-film-400"
              />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-heading font-bold ${batchPresetIds.includes("custom") ? "text-film-700" : "text-[var(--text)]"}`}>
                  Custom
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">
                  {recipe.customWidth}×{recipe.customHeight}px
                </p>
              </div>
            </label>
          </div>

          {batchPresetIds.includes("custom") && (
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
                  onChange={(e) => onRecipeChange({ customWidth: Number(e.target.value) })}
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
                  onChange={(e) => onRecipeChange({ customHeight: Number(e.target.value) })}
                  className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 transition-shadow"
                />
              </div>
            </div>
          )}

          {batchPresetIds.length < 2 && (
            <p className="text-[10px] text-film-600 font-heading font-semibold">
              Choose at least two presets to run a batch.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
