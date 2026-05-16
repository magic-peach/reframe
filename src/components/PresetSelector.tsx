"use client";

import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import { Settings2, Lock, Unlock } from "lucide-react";
import { useState, useCallback ,useRef } from "react";
import { cn } from "@/lib/utils";

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

  const [locked, setLocked] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  const lockedRef = useRef(false);
const aspectRatioRef = useRef(16 / 9);

console.log("PRESET SELECTOR LOADED");
  const handleToggleLock = useCallback(() => {
  if (!lockedRef.current) {
    const w = recipe.customWidth ?? 1920;
    const h = recipe.customHeight ?? 1080;
    const ratio = h !== 0 ? w / h : 16 / 9;
    setAspectRatio(ratio);
    aspectRatioRef.current = ratio;
  }
  setLocked((prev) => {
    lockedRef.current = !prev;
    return !prev;
  });
}, [recipe.customWidth, recipe.customHeight]);

  const handleWidthChange = useCallback((w: number) => {
   console.log("locked:", lockedRef.current, "ratio:", aspectRatioRef.current);
  const patch: Partial<EditRecipe> = { customWidth: w };
  if (lockedRef.current) patch.customHeight = Math.round(w / aspectRatioRef.current);
  onChange(patch);
}, [onChange]);

const handleHeightChange = useCallback((h: number) => {
  const patch: Partial<EditRecipe> = { customHeight: h };
  if (lockedRef.current) patch.customWidth = Math.round(h * aspectRatioRef.current);
  onChange(patch);
}, [onChange]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESETS.filter((p) => p.id !== "custom").map((preset) => {
          const active = recipe.preset === preset.id;
          return (
            <button
              type="button"
              key={preset.id}
              onClick={() => onChange({ preset: preset.id })}
              title={`${preset.label} — ${preset.width}×${preset.height} — ${getOrientationLabel(preset.width, preset.height)}`}
              aria-label={`Select ${preset.label} preset, ${preset.width} by ${preset.height} pixels`}
              aria-pressed={active}
              className={cn(
                "min-h-[44px] min-w-[44px] flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                active
                  ? "border-film-500 bg-film-50"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
              )}
            >
              <RatioBox width={preset.width} height={preset.height} active={active} />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className={cn(
                  "text-xs font-heading font-bold leading-tight whitespace-nowrap",
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

        <button
          type="button"
          title="Custom — Set your own dimensions"
          aria-label="Select custom dimensions preset"
          aria-pressed={recipe.preset === "custom"}
          onClick={() => onChange({ preset: "custom" })}
          className={cn(
            "min-h-[44px] min-w-[44px] flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
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

      {recipe.preset === "custom" && (
        <div className="flex gap-3 items-center p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] animate-fade-in">
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
              
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 transition-shadow"
            />
          </div>

          <button
            type="button"
            onClick={handleToggleLock}
            title={locked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            className={cn(
              "mt-5 p-1.5 rounded-md border transition-colors cursor-pointer",
              locked
                ? "border-film-500 bg-film-50 text-film-600"
                : "border-[var(--border)] text-[var(--muted)] hover:border-film-300 hover:text-film-500"
            )}
          >
            {locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>

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
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 transition-shadow"
            />
          </div>
        </div>
      )}
    </div>
  );
}
