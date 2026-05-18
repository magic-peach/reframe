"use client";

import { useCallback, useState } from "react";

import { Search, Settings2 } from "lucide-react";

import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

function getOrientationLabel(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratio = `${width / divisor}:${height / divisor}`;
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
        "border-2 flex-shrink-0 rounded-sm transition-colors",
        active ? "border-film-600" : "border-[var(--muted)] opacity-60",
      )}
      style={{ width: w, height: h }}
    />
  );
}

export default function PresetSelector({ recipe, onChange }: Props) {
  const [search, setSearch] = useState("");

  const filteredPresets = PRESETS.filter(
    (preset) =>
      preset.id !== "custom" &&
      (preset.label.toLowerCase().includes(search.toLowerCase()) ||
        preset.platform.toLowerCase().includes(search.toLowerCase())),
  );

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      onChange({ preset: presetId });
      setSearch("");
    },
    [onChange],
  );

  const handleWidthChange = useCallback(
    (width: number) => {
      onChange({ customWidth: width });
    },
    [onChange],
  );

  const handleHeightChange = useCallback(
    (height: number) => {
      onChange({ customHeight: height });
    },
    [onChange],
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search size={14} className="text-[var(--muted)]" />
        </div>
        <input
          type="text"
          placeholder="Search formats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm font-heading text-[var(--text)] transition-shadow focus:outline-none focus:ring-2 focus:ring-film-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filteredPresets.length === 0 ? (
          <div className="col-span-full py-4 text-center text-sm text-[var(--muted)]">
            No presets found
          </div>
        ) : (
          filteredPresets.map((preset) => {
            const active = recipe.preset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                title={`${preset.label} — ${preset.width}×${preset.height} — ${getOrientationLabel(preset.width, preset.height)}`}
                aria-label={`Select ${preset.label} preset, ${preset.width} by ${preset.height} pixels`}
                aria-pressed={active}
                className={cn(
                  "min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-center transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                  active
                    ? "border-film-500 bg-film-50"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30",
                )}
              >
                <RatioBox
                  width={preset.width}
                  height={preset.height}
                  active={active}
                />

                <div className="min-w-0 w-full">
                  <p
                    className={cn(
                      "text-sm font-heading font-bold leading-tight",
                      active ? "text-film-700" : "text-[var(--text)]",
                    )}
                  >
                    {preset.label}
                  </p>

                  <p className="mt-0.5 text-[11px] leading-tight text-[var(--muted)]">
                    {preset.platform}
                  </p>
                </div>
              </button>
            );
          })
        )}

        <button
          type="button"
          title="Custom — Set your own dimensions"
          aria-label="Select custom dimensions preset"
          aria-pressed={recipe.preset === "custom"}
          onClick={() => handlePresetSelect("custom")}
          className={cn(
            "min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-center transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
            recipe.preset === "custom"
              ? "border-film-500 bg-film-50"
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
          <div className="min-w-0 w-full">
            <p
              className={cn(
                "text-sm font-heading font-bold",
                recipe.preset === "custom"
                  ? "text-film-700"
                  : "text-[var(--text)]",
              )}
            >
              Custom
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-[var(--muted)]">
              Set your own
            </p>
          </div>
        </button>
      </div>

      {recipe.preset === "custom" && (
        <div className="mt-2 flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm animate-fade-in">
          <div className="flex-1">
            <label
              htmlFor="custom-width"
              className="mb-1.5 block text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]"
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
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-heading transition-all focus:outline-none focus:ring-2 focus:ring-film-400"
            />
          </div>

          <div className="mt-5 flex flex-col items-center justify-center">
            <span className="font-heading text-sm font-medium text-[var(--muted)]">
              ×
            </span>
          </div>

          <div className="flex-1">
            <label
              htmlFor="custom-height"
              className="mb-1.5 block text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]"
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
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-heading transition-all focus:outline-none focus:ring-2 focus:ring-film-400"
            />
          </div>

          <div className="hidden h-full flex-col justify-end sm:flex">
            <span className="mb-1.5 block text-center text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
              Ratio
            </span>
            <div className="flex h-[38px] items-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-xs font-medium text-film-700">
              {getOrientationLabel(
                recipe.customWidth || 0,
                recipe.customHeight || 0,
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
