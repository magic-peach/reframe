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
}

export interface ExportResult {
  blobUrl: string;
  size: number;
  width: number;
  height: number;
  format: "mp4" | "webm";
  /** Present for batch exports — suggested download filename */
  filename?: string;
  presetId?: string;
}

export type ExportStatus =
  | "idle"
  | "loading-engine"
  | "exporting"
  | "done"
  | "error"
  | "cancelled";

/** 1-based `current` index for batch queue UI */
export interface BatchExportProgress {
  current: number;
  total: number;
  filename: string;
}

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
};
