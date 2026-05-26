"use client";

import { useEffect, useMemo, useState } from "react";
import type { EditRecipe } from "@/lib/types";
import { isValidRecipe } from "@/lib/types";

const PRESET_STORAGE_KEY = "reframe:saved-presets";
const MAX_SAVED_PRESETS = 20;

interface SavedPreset {
  id: string;
  name: string;
  recipe: EditRecipe;
  createdAt: number;
}

interface SavedPresetsProps {
  recipe: EditRecipe;
  onLoadPreset: (recipe: EditRecipe) => void;
}

function readSavedPresets(): SavedPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item: unknown): item is SavedPreset => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<SavedPreset>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.createdAt === "number" &&
        isValidRecipe(candidate.recipe)
      );
    });
  } catch {
    return [];
  }
}

function writeSavedPresets(presets: SavedPreset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

export default function SavedPresets({ recipe, onLoadPreset }: SavedPresetsProps) {
  const [name, setName] = useState("");
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const stored = readSavedPresets();
    setSavedPresets(stored);
    if (stored.length > 0) {
      setSelectedId(stored[0]?.id ?? "");
    }
  }, []);

  const selectedPreset = useMemo(
    () => savedPresets.find((preset) => preset.id === selectedId) ?? null,
    [savedPresets, selectedId]
  );

  const canAddMore = savedPresets.length < MAX_SAVED_PRESETS;

  const makeUniqueName = (base: string) => {
    const trimmedBase = base.trim() || "Preset";
    const names = new Set(savedPresets.map((preset) => preset.name.toLowerCase()));
    if (!names.has(trimmedBase.toLowerCase())) return trimmedBase;

    let i = 2;
    while (names.has(`${trimmedBase} ${i}`.toLowerCase())) {
      i += 1;
    }
    return `${trimmedBase} ${i}`;
  };

  const saveCurrentPreset = () => {
    if (!canAddMore) return;
    const trimmed = name.trim();
    const fallbackIndex = savedPresets.length + 1;
    const desiredName = trimmed || `Preset ${fallbackIndex}`;
    const presetName = makeUniqueName(desiredName);

    const nextPreset: SavedPreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: presetName,
      recipe,
      createdAt: Date.now(),
    };

    const next = [nextPreset, ...savedPresets];
    setSavedPresets(next);
    setSelectedId(nextPreset.id);
    setName("");
    writeSavedPresets(next);
  };

  const deleteSelectedPreset = () => {
    if (!selectedPreset) return;
    const next = savedPresets.filter((preset) => preset.id !== selectedPreset.id);
    setSavedPresets(next);
    setSelectedId(next[0]?.id ?? "");
    writeSavedPresets(next);
  };

  const loadSelectedPreset = () => {
    if (!selectedPreset) return;
    onLoadPreset(selectedPreset.recipe);
  };

  const startAddAnother = () => {
    setName("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Preset name"
          aria-label="Preset name"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={saveCurrentPreset}
          disabled={!canAddMore}
          className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide hover:border-film-500"
          aria-label="Save current settings as preset"
        >
          Save
        </button>
      </div>

      {!canAddMore && (
        <p className="text-xs text-[var(--warning)]">
          Preset limit reached ({MAX_SAVED_PRESETS}). Delete one to add more.
        </p>
      )}

      {savedPresets.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">No saved presets yet.</p>
      ) : (
        <div className="space-y-2">
          <label htmlFor="saved-preset-select" className="text-xs text-[var(--muted)]">
            Saved presets
          </label>
          <select
            id="saved-preset-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            aria-label="Select saved preset"
          >
            {savedPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSelectedPreset}
              className="rounded-lg bg-film-600 px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide text-white hover:bg-film-700"
              aria-label="Load selected preset"
            >
              Load
            </button>
            <button
              type="button"
              onClick={deleteSelectedPreset}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--text)]"
              aria-label="Delete selected preset"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={startAddAnother}
              disabled={!canAddMore}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-heading font-bold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50"
              aria-label="Add another preset"
            >
              Add another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
