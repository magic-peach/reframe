export interface EditRecipe {
  preset: string;
  customWidth: number;
  customHeight: number;
  framing: "fit" | "fill";
  trimStart: number;
  trimEnd: number | null;
  rotate: 0 | 90 | 180 | 270;
  keepAudio: boolean;
  speed: number;
  quality: number;
  format: "mp4" | "webm" | "mkv";

  brightness: number;
  contrast: number;
  saturation: number;
}

export interface ExportResult {
  blobUrl: string;
  size: number;
  width: number;
  height: number;
  format: "mp4" | "webm" | "mkv";
}

export type ExportStatus =
  | "idle"
  | "loading-engine"
  | "exporting"
  | "done"
  | "error";

export const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4] as const;

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
  format: "mp4",
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

export const MAX_FILE_SIZE =
  2 * 1024 * 1024 * 1024; // 2GB

export const WARNING_FILE_SIZE =
  500 * 1024 * 1024; // 500MB
