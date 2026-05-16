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

  brightness: number;
  contrast: number;
  saturation: number;
}

export interface ExportResult {
  blobUrl: string;
  size: number;
  width: number;
  height: number;
  format: "mp4" | "webm";
}

export type ExportStatus =
  | "idle"
  | "loading-engine"
  | "exporting"
  | "done"
  | "error";

