import type { EditRecipe } from "@/lib/types";

export function supportsAutoReframeRotation(rotate: EditRecipe["rotate"]): boolean {
  return rotate === 0 || rotate === 180;
}

export function getAutoReframeUnavailableReason(recipe: Pick<EditRecipe, "framing" | "rotate">): string | null {
  if (recipe.framing !== "fill") {
    return "AI tracking is available for Fill framing only.";
  }

  if (!supportsAutoReframeRotation(recipe.rotate)) {
    return "AI tracking is disabled for 90° and 270° rotation.";
  }

  return null;
}

export function canUseAutoReframe(recipe: Pick<EditRecipe, "autoReframe" | "framing" | "rotate">): boolean {
  return recipe.autoReframe && getAutoReframeUnavailableReason(recipe) === null;
}
