import type { EditRecipe } from "./types"
import { RECIPE_VERSION } from "./types"

export const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4] as const;

/**
 * Upper bound (in bytes) on the file size for which audio waveform extraction
 * is attempted. The app accepts uploads up to 2 GB, but decoding a file of that
 * size with the Web Audio API reads the whole thing into memory (raw buffer +
 * decoded PCM), which spikes the heap and crashes browser tabs (#1013).
 *
 * Files at or below this threshold are decoded as before; larger files skip
 * waveform extraction and fall back to a static placeholder so the editor stays
 * responsive. 300 MB keeps the worst-case waveform allocation bounded while
 * still covering the vast majority of real-world clips.
 */
export const MAX_WAVEFORM_FILE_SIZE_BYTES = 300 * 1024 * 1024;

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
  contrast: 1,
  saturation: 1,
  stabilization: false,
  denoise: false,
  soundOnCompletion: false,
  normalizeAudio: false,
  textOverlays: [],
  version: RECIPE_VERSION,
};
