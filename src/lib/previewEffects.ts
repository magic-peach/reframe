import { CSSProperties } from "react";
import { EditRecipe } from "./types";

export function buildPreviewEffects(recipe?: EditRecipe): CSSProperties {
  if (!recipe) return {};

  const styles: CSSProperties = {};
  const filters: string[] = [];

  if (recipe.rotate) {
    styles.transform = `rotate(${recipe.rotate}deg)`;
    styles.transformOrigin = "center center";
  }

  if (recipe.brightness !== 0) {
    filters.push(`brightness(${Math.max(0, 1 + recipe.brightness)})`);
  }
  if (recipe.contrast !== 1) {
    filters.push(`contrast(${recipe.contrast})`);
  }
  if (recipe.saturation !== 1) {
    filters.push(`saturate(${recipe.saturation})`);
  }

  if (filters.length > 0) {
    styles.filter = filters.join(" ");
  }

  return styles;
}
