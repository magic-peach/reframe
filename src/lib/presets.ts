export interface Preset {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
  icon: string; // emoji icon for the preset card
}

// All presets are defined here. Adding a new one is as simple as adding to this array.
export const PRESETS: Preset[] = [
  {
    id: "vertical-9-16",
    label: "Reels / Shorts / TikTok",
    description: "1080 × 1920 · 9:16",
    width: 1080,
    height: 1920,
    icon: "📱",
  },
  {
    id: "instagram-4-5",
    label: "Instagram Feed",
    description: "1080 × 1350 · 4:5",
    width: 1080,
    height: 1350,
    icon: "📸",
  },
  {
    id: "square-1-1",
    label: "Square",
    description: "1080 × 1080 · 1:1",
    width: 1080,
    height: 1080,
    icon: "⬛",
  },
  {
    id: "landscape-16-9",
    label: "YouTube / Landscape",
    description: "1920 × 1080 · 16:9",
    width: 1920,
    height: 1080,
    icon: "🖥️",
  },
  {
    id: "twitter-hd",
    label: "Twitter / X",
    description: "1280 × 720 · 16:9",
    width: 1280,
    height: 720,
    icon: "🐦",
  },
  {
    id: "ultrawide-21-9",
    label: "Ultrawide",
    description: "2560 × 1080 · 21:9",
    width: 2560,
    height: 1080,
    icon: "🖼️",
  },
  {
    id: "instagram-panoramic",
    label: "Instagram Panoramic",
    description: "5120 × 1080 · Extra long",
    width: 5120,
    height: 1080,
    icon: "🌅",
  },
  {
    id: "portrait-3-4",
    label: "Portrait",
    description: "1080 × 1440 · 3:4",
    width: 1080,
    height: 1440,
    icon: "🖼️",
  },
  {
    id: "cinema-scope",
    label: "Anamorphic / Cinema",
    description: "2048 × 858 · 2.39:1",
    width: 2048,
    height: 858,
    icon: "🎬",
  },
  {
    id: "dci-2k",
    label: "DCI 2K",
    description: "2048 × 1080 · 17:9",
    width: 2048,
    height: 1080,
    icon: "🎥",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Set your own size",
    width: 1920,
    height: 1080,
    icon: "✏️",
  },
];

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
