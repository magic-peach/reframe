export type SuggestedPresetId =
  | "vertical-9-16"
  | "landscape-16-9"
  | "square-1-1";

export function suggestPreset(width: number, height: number): SuggestedPresetId {
  if (!width || !height) return "landscape-16-9";

  const ratio = width / height;

  // Midpoint between 9:16 (0.5625) and 1:1 (1.0) is approx 0.78
  if (ratio < 0.78) {
    return "vertical-9-16";
  }

  // Midpoint between 1:1 (1.0) and 16:9 (1.777) is approx 1.38
  if (ratio >= 0.78 && ratio <= 1.38) {
    return "square-1-1";
  }

  // Anything wider than 1.38 defaults cleanly to Landscape
  return "landscape-16-9";
}