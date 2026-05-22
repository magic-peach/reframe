"use client";

import { useCallback, useState } from "react";

import { Search, Settings2 } from "lucide-react";

import { PRESETS } from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import AspectRatioThumbnail from "@/components/ui/AspectRatioThumbnail";

interface Props {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
}

function presetButtonClass(active: boolean) {
  return cn(
    "min-h-[44px] min-w-[44px] w-full flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-center",
    "transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
    active
      ? "border-film-500 bg-film-50"
      : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30",
  );
}

function getOrientationLabel(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratio = `${width / divisor}:${height / divisor}`;
  const orientation =
    width === height ? "Square" : width > height ? "Landscape" : "Portrait";
  return `${orientation} (${ratio})`;
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
    <div id="preset-selector" className="space-y-3">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search size={14} className="text-[var(--muted)]" />
        </div>
        <Tooltip
          block
          content="Search presets by platform or format name."
        >
          <input
            type="text"
            placeholder="Search formats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search output size presets"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2 pl-9 pr-3 text-sm font-heading text-[var(--text)] transition-shadow focus:outline-none focus:ring-2 focus:ring-film-400"
          />
        </Tooltip>
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
              <Tooltip
                key={preset.id}
                block
                content={`${preset.label}: ${preset.width}×${preset.height} for ${preset.platform}.`}
              >
                <button
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  aria-label={`${preset.label} preset, ${preset.width} by ${preset.height} pixels`}
                  aria-pressed={active}
                  className={presetButtonClass(active)}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <AspectRatioThumbnail
                      width={preset.width}
                      height={preset.height}
                      active={active}
                    />
                  </span>

                  <div className="min-w-0 w-full">
                    <p
                      className={cn(
                        "text-sm font-heading font-bold leading-tight",
                        active ? "text-film-700" : "text-[var(--text)]",
                      )}
                    >
                      {preset.label}
                    </p>

                    <p className="mt-0.5 text-[11px] leading-tight text-[var(--muted)] line-clamp-2">
                      {preset.platform}
                    </p>
                  </div>
                </button>
              </Tooltip>
            );
          })
        )}

        <Tooltip block content="Set your own output width and height in pixels.">
          <button
            type="button"
            aria-label="Select custom dimensions preset"
            aria-pressed={recipe.preset === "custom"}
            onClick={() => handlePresetSelect("custom")}
            className={presetButtonClass(recipe.preset === "custom")}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              {recipe.preset === "custom" ? (
                <AspectRatioThumbnail
                  width={recipe.customWidth}
                  height={recipe.customHeight}
                  active
                />
              ) : (
                <Settings2 size={18} className="text-[var(--muted)]" />
              )}
            </span>

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
        </Tooltip>
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
            <Tooltip
              block
              content="Output width in pixels. Must be between 16 and 7680."
            >
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
            </Tooltip>
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
            <Tooltip
              block
              content="Output height in pixels. Must be between 16 and 7680."
            >
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
            </Tooltip>
          </div>

          <div className="hidden h-full flex-col justify-end sm:flex">
            <span className="mb-1.5 block text-center text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
              Ratio
            </span>
            <div className="flex h-[38px] items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-xs font-medium text-film-700">
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
