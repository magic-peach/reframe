import type { EditRecipe } from "./types";

export interface Preset {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
}

export const CUSTOM_PRESET_KEY = "reframe-custom-presets";

export interface CustomPreset {
  id: string;
  name: string;
  recipe: EditRecipe;
}

export const PRESETS: Preset[] = [
  {
    id: "vertical-9-16",
    label: "9 : 16",
    platform: "Reels · TikTok · Shorts",
    width: 1080,
    height: 1920,
  },
  {
    id: "instagram-4-5",
    label: "4 : 5",
    platform: "Instagram Feed",
    width: 1080,
    height: 1350,
  },
  {
    id: "square-1-1",
    label: "1 : 1",
    platform: "Square",
    width: 1080,
    height: 1080,
  },
  {
    id: "landscape-16-9",
    label: "16 : 9",
    platform: "YouTube · Landscape",
    width: 1920,
    height: 1080,
  },
  {
    id: "twitter-hd",
    label: "16 : 9",
    platform: "Twitter / X",
    width: 1280,
    height: 720,
  },
  {
    id: "ultrawide-21-9",
    label: "21 : 9",
    platform: "Ultrawide",
    width: 2560,
    height: 1080,
  },
  {
    id: "instagram-panoramic",
    label: "47 : 10",
    platform: "IG Panoramic",
    width: 5120,
    height: 1080,
  },
  {
    id: "portrait-3-4",
    label: "3 : 4",
    platform: "Portrait",
    width: 1080,
    height: 1440,
  },
  {
    id: "cinema-scope",
    label: "2.39 : 1",
    platform: "Anamorphic Cinema",
    width: 2048,
    height: 858,
  },
  {
    id: "dci-2k",
    label: "17 : 9",
    platform: "DCI 2K",
    width: 2048,
    height: 1080,
  },
  {
    id: "custom",
    label: "Custom",
    platform: "Set your own",
    width: 1920,
    height: 1080,
  },
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}

export function loadCustomPresets(): CustomPreset[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(CUSTOM_PRESET_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomPresets(
  presets: CustomPreset[],
) {
  localStorage.setItem(
    CUSTOM_PRESET_KEY,
    JSON.stringify(presets),
  );
}
