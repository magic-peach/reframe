export const RECIPE_VERSION = 1;

/**
 * Text overlay data structure for rendering custom text on videos.
 */
export interface TextOverlay {
  id: string;
  text: string;
  x: number; // Percentage (0-100) from left
  y: number; // Percentage (0-100) from top
  fontSize: number; // In pixels
  color: string; // Hex color
  fontWeight: "normal" | "bold" | "900";
  fontFamily?: string; // Font family name (e.g., "Arial", "Inter", "CustomFont")
  fontPath?: string; // Path/URL to custom font file for export
}

export interface EditRecipe {
  preset: string;
  customWidth: number;
  customHeight: number;
  framing: "fit" | "fill";
  trimStart: number;
  trimEnd: number | null;
  rotate: 0 | 90 | 180 | 270;
  keepAudio: boolean;
  normalizeAudio: boolean;
  speed: number;
  quality: number;
  format: "mp4" | "webm" | "mkv" | "gif";
  stabilization: boolean;
  denoise: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  soundOnCompletion: boolean;
  textOverlays: TextOverlay[];
  version: number;
}

export type OverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface ImageOverlayOptions {
  file: File | null;
  position: OverlayPosition;
  size: number;
  opacity: number;
}

export interface BackgroundMusicOptions {
  file: File | null;
  musicVolume: number;
  originalAudioVolume: number;
  loopMusic: boolean;
}

export interface ExportResult {
  blobUrl: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
  format: "mp4" | "webm" | "mkv" | "gif";
  exportDurationMs?: number;
}

export type ExportStatus =
  | "idle"
  | "loading-engine"
  | "exporting"
  | "done"
  | "error";

export const MAX_FILE_SIZE =
  2 * 1024 * 1024 * 1024;

export const WARNING_FILE_SIZE =
  500 * 1024 * 1024; // 500MB

export function isValidRecipe(value: unknown): value is EditRecipe {
  if (!value || typeof value !== "object") return false;
  const v = value as any;

  if (typeof v.version !== "number" || v.version !== RECIPE_VERSION) return false;
  if (typeof v.preset !== "string") return false;
  if (typeof v.customWidth !== "number" || !isFinite(v.customWidth)) return false;
  if (typeof v.customHeight !== "number" || !isFinite(v.customHeight)) return false;
  if (v.framing !== "fit" && v.framing !== "fill") return false;
  if (typeof v.trimStart !== "number" || !isFinite(v.trimStart)) return false;
  if (!(v.trimEnd === null || (typeof v.trimEnd === "number" && isFinite(v.trimEnd)))) return false;
  if (![0, 90, 180, 270].includes(v.rotate)) return false;
  if (typeof v.keepAudio !== "boolean") return false;
  if (typeof v.normalizeAudio !== "boolean") return false;
  if (typeof v.speed !== "number" || !isFinite(v.speed)) return false;
  if (typeof v.quality !== "number" || !isFinite(v.quality)) return false;
  if (!["mp4", "webm", "mkv", "gif"].includes(v.format)) return false;
  if (typeof v.stabilization !== "boolean") return false;
  if (typeof v.brightness !== "number" || !isFinite(v.brightness)) return false;
  if (typeof v.contrast !== "number" || !isFinite(v.contrast)) return false;
  if (typeof v.saturation !== "number" || !isFinite(v.saturation)) return false;
  if (typeof v.soundOnCompletion !== "boolean") return false;
  if (!Array.isArray(v.textOverlays)) return false;

  return true;
}
