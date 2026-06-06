import { DEFAULT_RECIPE } from "@/lib/constants";
import { EditRecipe, OverlayPosition, isValidRecipe } from "@/lib/types";

export const RECIPE_STORAGE_KEY = "reframe:recipe";
export const LEGACY_SETTINGS_KEY = "reframe-settings";
export const EDITOR_STATE_KEY = "editorState";
export const SOUND_PREF_KEY = "soundOnCompletion";

export interface OverlayEditorState {
  overlayPosition?: OverlayPosition;
  overlaySize?: number;
  overlayOpacity?: number;
}

export function migrateRecipe(recipe: Partial<EditRecipe>): EditRecipe {
  return {
    ...DEFAULT_RECIPE,
    ...recipe,
    textOverlays: Array.isArray(recipe.textOverlays) ? recipe.textOverlays : [],
  };
}

export function getStoredSoundPreference(storage: Pick<Storage, "getItem">): boolean {
  return storage.getItem(SOUND_PREF_KEY) === "true";
}

export function loadPersistedRecipe(
  storage: Pick<Storage, "getItem">,
  fallback: EditRecipe
): EditRecipe {
  const raw = storage.getItem(RECIPE_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isValidRecipe(parsed)) {
        return parsed;
      }
    } catch {
      // fall through to legacy state
    }
  }

  const legacy = storage.getItem(LEGACY_SETTINGS_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      return migrateRecipe({
        preset: parsed.preset ?? fallback.preset,
        quality: parsed.quality ?? fallback.quality,
        speed: parsed.speed ?? fallback.speed,
        customWidth: Number.isFinite(Number(parsed.customWidth)) ? Number(parsed.customWidth) : fallback.customWidth,
        customHeight: Number.isFinite(Number(parsed.customHeight)) ? Number(parsed.customHeight) : fallback.customHeight,
      });
    } catch {
      // ignore malformed legacy data
    }
  }

  return fallback;
}

export function loadOverlayState(
  storage: Pick<Storage, "getItem">,
  fallback: OverlayEditorState
): OverlayEditorState {
  const raw = storage.getItem(EDITOR_STATE_KEY);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as OverlayEditorState & { recipe?: unknown };
    return {
      overlayPosition: typeof parsed.overlayPosition === "string" ? parsed.overlayPosition : fallback.overlayPosition,
      overlaySize: typeof parsed.overlaySize === "number" ? parsed.overlaySize : fallback.overlaySize,
      overlayOpacity: typeof parsed.overlayOpacity === "number" ? parsed.overlayOpacity : fallback.overlayOpacity,
    };
  } catch {
    return fallback;
  }
}

export function persistRecipe(storage: Pick<Storage, "setItem" | "removeItem">, recipe: EditRecipe) {
  storage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipe));
  storage.removeItem(LEGACY_SETTINGS_KEY);
}

export function persistSoundPreference(storage: Pick<Storage, "setItem">, soundOnCompletion: boolean) {
  storage.setItem(SOUND_PREF_KEY, String(soundOnCompletion));
}

export function persistOverlayState(storage: Pick<Storage, "setItem">, overlay: OverlayEditorState) {
  storage.setItem(
    EDITOR_STATE_KEY,
    JSON.stringify({
      overlayPosition: overlay.overlayPosition,
      overlaySize: overlay.overlaySize,
      overlayOpacity: overlay.overlayOpacity,
    })
  );
}
