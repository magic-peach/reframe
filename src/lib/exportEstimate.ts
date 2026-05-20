import { EditRecipe } from "./types";

function getBaseBitrate(crf: number): number {
  if (crf <= 18) return 6;
  if (crf <= 23) return 2;
  if (crf <= 28) return 1;
  return 0.6;
}

function getResolutionMultiplier(width: number, height: number): number {
  const pixels = width * height;
  const fullHdPixels = 1920 * 1080;

  return Math.max(pixels / fullHdPixels, 0.25);
}

export function estimateExportSize(
  recipe: EditRecipe,
  duration: number
): number {
  const trimEnd = recipe.trimEnd ?? duration;

  const effectiveDuration = Math.max(
    trimEnd - recipe.trimStart,
    1
  );

  if (recipe.format === "gif") {
    const GIF_FPS = 15;
    
    const BASE_COMPRESSION = 0.85;
    
    const qualityLossModifier = (recipe.quality - 18) * 0.035;
    const effectiveCompression = Math.max(BASE_COMPRESSION - qualityLossModifier, 0.35);

    const frames = (effectiveDuration / Math.max(recipe.speed, 0.25)) * GIF_FPS;
    return (recipe.customWidth * recipe.customHeight * frames * effectiveCompression) / (1024 * 1024);
  }

  const baseBitrate = getBaseBitrate(recipe.quality);

  const resolutionMultiplier = getResolutionMultiplier(
    recipe.customWidth,
    recipe.customHeight
  );

  const adjustedBitrate =
    (baseBitrate * resolutionMultiplier) /
    Math.max(recipe.speed, 0.25);

  return (adjustedBitrate * effectiveDuration) / 8;
}

export function formatEstimatedSize(sizeMb: number): string {
  if (sizeMb >= 1024) {
    return `~${(sizeMb / 1024).toFixed(1)} GB`;
  }

  if (sizeMb < 1) {
    return `~${(sizeMb * 1024).toFixed(0)} KB`;
  }

  return `~${sizeMb.toFixed(1)} MB`;
}