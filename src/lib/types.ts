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
  stabilization: boolean;
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

export const MAX_FILE_SIZE =
  2 * 1024 * 1024 * 1024; // 2GB

export const WARNING_FILE_SIZE =
  500 * 1024 * 1024; // 500MB
