"use client";

import { useState, useEffect } from "react";
import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import { Settings2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Define the shape of our saved custom presets
interface SavedPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

function getOrientationLabel(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  const ratio = `${width / d}:${height / d}`;
  const orientation = width === height ? "Square" : width > height ? "Landscape" : "Portrait";
  return `${orientation} ${ratio}`;
}

function RatioBox({ width, height, active }: { width: number; height: number; active: boolean }) {
  const MAX = 32;
  const ratio = width / height;
  const [w, h] = ratio >= 1
    ? [MAX, Math.max(4, Math.round(MAX / ratio))]
    : [Math.max(4, Math.round(MAX * ratio)), MAX];

  return (
    <div
      className={cn(
        "border-2 flex-shrink-0 transition-colors",
        active ? "border-film-600" : "border-[var(--muted)] opacity-60"
      )}
      style={{ width: w, height: h }}
    />
  );
}

export default function PresetSelector({ recipe, onChange }: Props) {
  // 2. Setup state for saved presets and the new preset name input
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");

  // 3. Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("reframe_custom_presets");
    if (stored) {
      try {
        setSavedPresets(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved presets", e);
      }
    }
  }, []);

  // 4. Handle saving a new preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: SavedPreset = {
      id: `custom-${Date.now()}`,
      label: newPresetName.trim(),
      width: recipe.customWidth,
      height: recipe.customHeight,
    };
    
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem("reframe_custom_presets", JSON.stringify(updated));
    setNewPresetName("");
    
    // Automatically select the newly saved preset
    onChange({ 
      preset: newPreset.id, 
      customWidth: newPreset.width, 
      customHeight: newPreset.height 
    });
  };

  // 5. Handle deleting a preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the button click from also selecting the preset
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem("reframe_custom_presets", JSON.stringify(updated));
    
    // If they deleted the preset they currently have selected, revert to custom
    if (recipe.preset === id) {
      onChange({ preset: "custom" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {/* Render built-in presets */}
        {PRESETS.filter((p) => p.id !== "custom").map((preset) => {
          const active = recipe.preset === preset.id;
          return (
            <button
              type="button"
              key={preset.id}
              onClick={() => onChange({ preset: preset.id, customWidth: preset.width, customHeight: preset.height })}
              title={`${preset.label} — ${preset.width}×${preset.height} — ${getOrientationLabel(preset.width, preset.height)}`}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer",
                "hover:scale-[1.02] active:scale-[0.98]",
                active
                  ? "border-film-500 bg-film-50"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
              )}
            >
              <RatioBox width={preset.width} height={preset.height} active={active} />
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-xs font-heading font-bold leading-tight",
                  active ? "text-film-700" : "text-[var(--text)]"
                )}>
                  {preset.label}
                </p>
                <p className="text-[10px] text-[var(--muted)] leading-tight mt-0.5 truncate">
                  {preset.platform}
                </p>
              </div>
            </button>
          );
        })}

        {/* Render dynamically saved custom presets */}
        {savedPresets.map((preset) => {
          const active = recipe.preset === preset.id;
          return (
            <button
              type="button"
              key={preset.id}
              onClick={() => onChange({ preset: preset.id, customWidth: preset.width, customHeight: preset.height })}
              title={`${preset.label} — ${preset.width}×${preset.height}`}
              className={cn(
                "group relative flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer",
                "hover:scale-[1.02] active:scale-[0.98]",
                active
                  ? "border-film-500 bg-film-50"
                  : "border-film-200 bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
              )}
            >
              <RatioBox width={preset.width} height={preset.height} active={active} />
              <div className="min-w-0 flex-1 pr-4">
                <p className={cn(
                  "text-xs font-heading font-bold leading-tight truncate",
                  active ? "text-film-700" : "text-[var(--text)]"
                )}>
                  {preset.label}
                </p>
                <p className="text-[10px] text-film-500 font-medium leading-tight mt-0.5 truncate">
                  Saved Custom
                </p>
              </div>
              <div 
                onClick={(e) => handleDeletePreset(preset.id, e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 text-[var(--muted)] transition-all"
                title="Delete preset"
              >
                <X size={14} />
              </div>
            </button>
          );
        })}

        {/* The Custom Trigger Button */}
        <button
          type="button"
          title="Custom — Set your own dimensions"
          onClick={() => onChange({ preset: "custom" })}
          className={cn(
            "flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150",
            "hover:scale-[1.02] active:scale-[0.98]",
            recipe.preset === "custom"
              ? "border-film-500 bg-film-50"
              : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
          )}
        >
          <Settings2
            size={20}
            className={cn(
              "shrink-0",
              recipe.preset === "custom" ? "text-film-600" : "text-[var(--muted)]"
            )}
          />
          <div className="min-w-0">
            <p className={cn(
              "text-xs font-heading font-bold",
              recipe.preset === "custom" ? "text-film-700" : "text-[var(--text)]"
            )}>
              Custom
            </p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">Set your own</p>
          </div>
        </button>
      </div>

      {/* The Custom Configuration Panel */}
      {recipe.preset === "custom" && (
        <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] animate-fade-in space-y-3">
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label htmlFor="custom-width" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                Width px
              </label>
              <input
                id="custom-width"
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
              <label htmlFor="custom-height" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                Height px
              </label>
              <input
                id="custom-height"
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
          
          {/* New Save Preset Row */}
          <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
            <input
              type="text"
              placeholder="Name your preset..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
              className="flex-1 text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-film-400"
            />
            <button
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-film-600 hover:bg-film-700 disabled:opacity-50 disabled:hover:bg-film-600 text-white text-xs font-bold font-heading uppercase tracking-wide rounded-md transition-colors"
            >
              <Save size={14} />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}