import { EditRecipe } from "./types";

export function buildPreviewAdjustmentFilter(recipe: Pick<EditRecipe, "brightness" | "contrast" | "saturation">): string {
  const parts: string[] = [];

  if (recipe.brightness !== 0) {
    parts.push(`brightness(${Math.max(0, 1 + recipe.brightness).toFixed(3)})`);
  }

  if (recipe.contrast !== 1) {
    parts.push(`contrast(${Math.max(0, recipe.contrast).toFixed(3)})`);
  }

  if (recipe.saturation !== 1) {
    parts.push(`saturate(${Math.max(0, recipe.saturation).toFixed(3)})`);
  }

  return parts.join(" ");
}
