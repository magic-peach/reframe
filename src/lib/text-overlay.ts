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
 * Generates a drawtext FFmpeg filter string for a single text overlay.
 * Escapes special characters, scales font size to destination constraints,
 * and fixes quote boundary formatting problems.
 */
export function buildTextFilter(
  overlay: TextOverlay,
  targetWidth: number,
  targetHeight: number
): string {
  // 1. Correctly escape special characters for FFmpeg's drawtext interpreter
  // Single quotes must be wrapped as '\'' to break out and re-enter string parameters safely
  const escapedText = (overlay.text || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "'\\''")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,");

  // 2. Map coordinates relative to target export aspect resolution bounds
  const pixelX = Math.round((overlay.x / 100) * targetWidth);
  const pixelY = Math.round((overlay.y / 100) * targetHeight);

  // 3. Dynamically scale font size based on the output canvas aspect ratio context
  // Assumes 720p (720px height) is your interface's base editing standard
  const baseEditHeight = 720;
  const scaleFactor = targetHeight / baseEditHeight;
  const scaledFontSize = Math.max(12, Math.round((overlay.fontSize || 32) * scaleFactor));

  // 4. Resolve font configurations cleanly
  const fontFileParam = getFFmpegFontArg ? getFFmpegFontArg(overlay.fontFamily || "Arial", overlay.fontPath) : "";
  
  let fontConfig = "";
  if (fontFileParam) {
    // If our loader provided a complete mapping path flag, prioritize it natively
    fontConfig = fontFileParam;
  } else if (overlay.fontFamily) {
    // Fallback to system string registration tags safely cleared of special characters
    const safeFontName = overlay.fontFamily.replace(/[^a-zA-Z0-9-]/g, "");
    fontConfig = `fontfile='${safeFontName}'`;
  }

  // 5. Build final positional filter string matrix 
  // 👇 FIXED: Subtracted 'tw/2' and 'th/2' expressions to align perfectly with your UI center-origin layout
  const filterParts = [
    "drawtext",
    `text='${escapedText}'`,
    `x=${pixelX}-(tw/2)`,
    `y=${pixelY}-(th/2)`,
    `fontsize=${scaledFontSize}`,
    `fontcolor=${overlay.color || "white"}`,
  ];

  if (fontConfig) {
    filterParts.push(fontConfig);
  }

  // 6. Handle bold weights by passing style modifiers directly to the engine parameters
  if (overlay.fontWeight === "900" || overlay.fontWeight === "bold") {
    filterParts.push("style='Bold'");
  }

  // 7. Box background styling fallback support (optional block)
  // 👇 FIXED: Safely cast to any here so TypeScript doesn't complain about missing type definitions
  const dynamicOverlay = overlay as any;
  if (dynamicOverlay.showBackground) {
    filterParts.push("box=1");
    filterParts.push(`boxcolor=${dynamicOverlay.backgroundColor || "black@0.5"}`);
    filterParts.push(`boxborderw=${dynamicOverlay.backgroundPadding ?? 10}`);
  }

  return filterParts.join(":");
}
