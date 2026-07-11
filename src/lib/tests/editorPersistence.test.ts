import { describe, expect, it, beforeEach } from "vitest";
import { DEFAULT_RECIPE } from "@/lib/constants";
import {
  EDITOR_STATE_KEY,
  LEGACY_SETTINGS_KEY,
  RECIPE_STORAGE_KEY,
  loadOverlayState,
  loadPersistedRecipe,
  persistOverlayState,
  persistRecipe,
  persistSoundPreference,
} from "@/lib/editorPersistence";
import { EditRecipe } from "@/lib/types";

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

describe("editorPersistence", () => {
  const storage = createStorage();

  beforeEach(() => {
    storage.clear();
  });

  it("loads the canonical recipe key first", () => {
    const recipe: EditRecipe = { ...DEFAULT_RECIPE, quality: 28, version: DEFAULT_RECIPE.version };
    storage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipe));
    storage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify({ quality: 18 }));

    expect(loadPersistedRecipe(storage, DEFAULT_RECIPE)).toEqual(recipe);
  });

  it("migrates legacy settings when the canonical key is missing", () => {
    storage.setItem(
      LEGACY_SETTINGS_KEY,
      JSON.stringify({ preset: "custom", quality: 19, speed: 1.5, customWidth: 1280, customHeight: 720 })
    );

    const loaded = loadPersistedRecipe(storage, DEFAULT_RECIPE);

    expect(loaded.preset).toBe("custom");
    expect(loaded.quality).toBe(19);
    expect(loaded.speed).toBe(1.5);
    expect(loaded.customWidth).toBe(1280);
    expect(loaded.customHeight).toBe(720);
  });

  it("persists only the canonical recipe key and clears legacy recipe settings", () => {
    persistRecipe(storage, DEFAULT_RECIPE);

    expect(storage.getItem(RECIPE_STORAGE_KEY)).toBe(JSON.stringify(DEFAULT_RECIPE));
    expect(storage.getItem(LEGACY_SETTINGS_KEY)).toBeNull();
  });

  it("persists overlay state without recipe data", () => {
    persistOverlayState(storage, {
      overlayPosition: "top-left",
      overlaySize: 120,
      overlayOpacity: 85,
    });

    expect(JSON.parse(storage.getItem(EDITOR_STATE_KEY) ?? "{}")).toEqual({
      overlayPosition: "top-left",
      overlaySize: 120,
      overlayOpacity: 85,
    });
  });

  it("reads overlay state while ignoring any legacy embedded recipe", () => {
    storage.setItem(
      EDITOR_STATE_KEY,
      JSON.stringify({
        recipe: { quality: 12 },
        overlayPosition: "bottom-left",
        overlaySize: 155,
        overlayOpacity: 72,
      })
    );

    expect(loadOverlayState(storage, {
      overlayPosition: "bottom-right",
      overlaySize: 150,
      overlayOpacity: 100,
    })).toEqual({
      overlayPosition: "bottom-left",
      overlaySize: 155,
      overlayOpacity: 72,
    });
  });

  it("persists sound preference separately", () => {
    persistSoundPreference(storage, true);
    expect(storage.getItem("soundOnCompletion")).toBe("true");
  });
});
