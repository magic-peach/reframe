export type SuggestedPresetId =
  | "vertical-9-16"
  | "landscape-16-9"
  | "square-1-1";

export function suggestPreset(width: number, height: number): SuggestedPresetId {
  const ratio = width / height;

  if (Math.abs(ratio - 9 / 16) < 0.05) {
    return "vertical-9-16";
  }

  if (Math.abs(ratio - 16 / 9) < 0.05) {
    return "landscape-16-9";
  }

  if (Math.abs(ratio - 1) < 0.05) {
    return "square-1-1";
  }

  return width >= height ? "landscape-16-9" : "vertical-9-16";
}
