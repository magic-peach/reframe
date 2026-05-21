import type { EditRecipe } from "./types";

/** CSS filter for live preview — values map 1:1 to recipe sliders. */
export function buildColorGradeCssFilter(
  recipe: Pick<EditRecipe, "brightness" | "contrast" | "saturation">
): string {
  return `brightness(${1 + recipe.brightness}) contrast(${recipe.contrast}) saturate(${recipe.saturation})`;
}
