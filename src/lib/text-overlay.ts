import { TextOverlay, EditRecipe } from "./types";
import { getFFmpegFontArg } from "@/utils/fontLoader";

/**
 * Generates a unique ID for a text overlay.
 */
export function generateTextOverlayId(): string {
  return `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates a default text overlay with sensible defaults.
 * @param videoDuration - Video duration in seconds. If provided, endTime defaults to this value.
 */
export function createDefaultTextOverlay(videoDuration?: number): TextOverlay {
  return {
    id: generateTextOverlayId(),
    text: "Enter text",
    x: 50, // Centered horizontally
    y: 20, // Near top
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "normal",
    fontFamily: "Arial", // Default to Arial for immediate visibility
    startTime: 0, // Appears from start
    endTime: videoDuration && videoDuration > 0 ? videoDuration : Number.MAX_SAFE_INTEGER, // Show until end (or forever if duration unknown)
  };
}

/**
 * Calculates the position of a text overlay relative to the preview container.
 * @param percentX - Horizontal position as percentage (0-100)
 * @param percentY - Vertical position as percentage (0-100)
 * @param containerWidth - Width of the preview container in pixels
 * @param containerHeight - Height of the preview container in pixels
 */
export function getTextPixelPosition(
  percentX: number,
  percentY: number,
  containerWidth: number,
  containerHeight: number
): { left: number; top: number } {
  return {
    left: (percentX / 100) * containerWidth,
    top: (percentY / 100) * containerHeight,
  };
}

/**
 * Converts pixel position back to percentage within the container.
 */
export function getTextPercentPosition(
  pixelX: number,
  pixelY: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(100, (pixelX / containerWidth) * 100)),
    y: Math.max(0, Math.min(100, (pixelY / containerHeight) * 100)),
  };
}

/**
 * Checks whether a text overlay should be visible at the given time.
 * @param overlay - The text overlay to check
 * @param currentTime - Current playback time in seconds
 * @param videoDuration - Total video duration in seconds (used for backward compatibility)
 * @returns true if the overlay should be displayed at this time
 */
export function isTextOverlayVisible(
  overlay: TextOverlay,
  currentTime: number,
  videoDuration: number = 0
): boolean {
  // Backward compatibility: if no timing specified, show for entire duration
  const startTime = overlay.startTime ?? 0;
  const endTime = overlay.endTime ?? videoDuration;

  return currentTime >= startTime && currentTime < endTime;
}

/**
 * Normalizes timing for an overlay to ensure it has valid start/end times.
 * Used for backward compatibility when loading old overlays without timing.
 * @param overlay - The overlay to normalize
 * @param videoDuration - Total video duration in seconds
 * @returns Overlay with guaranteed startTime and endTime values
 */
export function normalizeOverlayTiming(
  overlay: TextOverlay,
  videoDuration: number = 0
): TextOverlay {
  return {
    ...overlay,
    startTime: overlay.startTime ?? 0,
    endTime: overlay.endTime ?? videoDuration,
  };
}

/**
 * Normalizes all text overlays in an EditRecipe to have valid timing.
 * Used for backward compatibility with recipes created before duration support.
 * @param recipe - The recipe to normalize
 * @param videoDuration - Total video duration in seconds
 * @returns Recipe with all overlays having guaranteed timing
 */
export function normalizeRecipeOverlays(
  recipe: EditRecipe,
  videoDuration: number = 0
): EditRecipe {
  const overlays = recipe.textOverlays ?? [];
  const normalizedOverlays = overlays.map(overlay =>
    normalizeOverlayTiming(overlay, videoDuration)
  );

  if (normalizedOverlays === overlays) {
    return recipe;
  }

  return {
    ...recipe,
    textOverlays: normalizedOverlays,
  };
}

/**
 * Generates a drawText FFmpeg filter for a single text overlay.
 * Escapes special characters and positions text on the output video.
 * Includes font family and custom font file support.
 * Respects overlay timing: text only appears during its active duration.
 */
export function buildTextFilter(
  overlay: TextOverlay,
  targetWidth: number,
  targetHeight: number,
  videoDuration: number = 0
): string {
  // Escape special characters for FFmpeg drawtext filter
  const escapedText = overlay.text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:");

  // Convert percentage position to pixel position
  const pixelX = Math.round((overlay.x / 100) * targetWidth);
  const pixelY = Math.round((overlay.y / 100) * targetHeight);

  // Build font parameters
  const fontWeightParam = overlay.fontWeight === "900"
    ? "bold"
    : overlay.fontWeight === "bold"
    ? "bold"
    : "normal";

  // Get font file parameter for custom fonts (if available)
  const fontFileParam = getFFmpegFontArg(overlay.fontFamily, overlay.fontPath);

  // Get normalized timing (backward compatible: defaults to full duration)
  const startTime = overlay.startTime ?? 0;
  const endTime = overlay.endTime ?? videoDuration;

  // Build the drawtext filter with font support and timing
  // The enable parameter uses the between(t,a,b) function to control visibility timing
  let filter = `drawtext=text='${escapedText}':x=${pixelX}:y=${pixelY}:fontsize=${overlay.fontSize}:fontcolor=${overlay.color}:fontweight=${fontWeightParam}:enable='between(t,${startTime},${endTime})'`;

  // Add custom font file path if available
  if (fontFileParam) {
    filter += `:${fontFileParam}`;
  }

  return filter;
}
