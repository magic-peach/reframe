import type { CompressionMode, EditRecipe } from './types'

export const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4] as const;

export interface CompressionModeOption {
  id: CompressionMode;
  label: string;
  description: string;
  quality: number;
  audioBitrate: string;
  x264Preset: "slow" | "medium";
  webmDeadline: "good" | "best";
}

export const COMPRESSION_MODE_OPTIONS: CompressionModeOption[] = [
  {
    id: "best",
    label: "Best",
    description: "Maximum detail",
    quality: 18,
    audioBitrate: "192k",
    x264Preset: "slow",
    webmDeadline: "best",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Quality and size",
    quality: 23,
    audioBitrate: "128k",
    x264Preset: "medium",
    webmDeadline: "good",
  },
  {
    id: "small",
    label: "Small",
    description: "Compressed output",
    quality: 29,
    audioBitrate: "96k",
    x264Preset: "slow",
    webmDeadline: "good",
  },
];

export function getCompressionModeOption(mode: CompressionMode) {
  return COMPRESSION_MODE_OPTIONS.find((option) => option.id === mode);
}

export const DEFAULT_RECIPE: EditRecipe = {
  preset: "vertical-9-16",
  customWidth: 1920,
  customHeight: 1080,
  framing: "fit",
  trimStart: 0,
  trimEnd: null,
  rotate: 0,
  keepAudio: true,
  speed: 1,
  quality: 23,
  compressionMode: "balanced",
  format: "mp4",
  brightness: 0,
  contrast: 1,
  saturation: 1,
};
