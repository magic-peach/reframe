import type { EditRecipe } from "./types"
import { RECIPE_VERSION } from "./types"
import { getPresetById } from "./presets"
import { getCenteredMaxCropBox } from "./crop-frame"

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
  contrast: 1,
  saturation: 1,
  stabilization: false,
  denoise: false,
  soundOnCompletion: false,
  normalizeAudio: false,
  textOverlays: [],
  ...(() => {
    const preset = getPresetById("vertical-9-16");
    const outputAspect = preset ? preset.width / preset.height : 9 / 16;
    const box = getCenteredMaxCropBox(outputAspect);
    return { cropBoxX: box.x, cropBoxY: box.y, cropBoxW: box.w, cropBoxH: box.h };
  })(),
  version: RECIPE_VERSION,
};
