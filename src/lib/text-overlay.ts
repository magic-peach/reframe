import { TextOverlay } from "./types";
import { getFFmpegFontArg } from "@/utils/fontLoader";

/**
 * Generates a unique ID for a text overlay.
 */
export function generateTextOverlayId(): string {
  return `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates a default text overlay with sensible defaults.
 */
export function createDefaultTextOverlay(): TextOverlay {
  return {
    id: generateTextOverlayId(),
    text: "Enter text",
    x: 50, // Centered horizontally
    y: 20, // Near top
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "normal",
    fontFamily: "Arial", // Default to Arial for immediate visibility
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
 * Generates a drawText FFmpeg filter for a single text overlay.
 * Escapes special characters and positions text on the output video.
 * Includes font family and custom font file support.
 */
export function buildTextFilter(
  overlay: TextOverlay,
  targetWidth: number,
  targetHeight: number
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

  // Build the drawtext filter with font support
  let filter = `drawtext=text='${escapedText}':x=${pixelX}:y=${pixelY}:fontsize=${overlay.fontSize}:fontcolor=${overlay.color}`;

  // Add bold flag only when font weight is bold (fontweight= is not a valid FFmpeg option)
  if (fontWeightParam === "bold") {
    filter += `:bold=1`;
  }

  // For system fonts (no custom fontfile), use font= with the family name
  // For custom fonts, use only the fontfile= path from getFFmpegFontArg
  if (overlay.fontFamily && !fontFileParam) {
    filter += `:font='${overlay.fontFamily}'`;
  }

  if (fontFileParam) {
    filter += `:${fontFileParam}`;
  }

  return filter;
}
