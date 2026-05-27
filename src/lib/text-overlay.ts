import { TextOverlay } from "./types";

export function buildTextFilter(overlay: TextOverlay, targetW: number, targetH: number): string {
  const x = Math.round((overlay.x / 100) * targetW);
  const y = Math.round((overlay.y / 100) * targetH);
  const weight = overlay.fontWeight === "bold" || overlay.fontWeight === "900" ? "bold" : "normal";
  const escaped = overlay.text.replace(/'/g, "\u2019").replace(/:/g, "\\:");
  return `drawtext=text='${escaped}':x=${x}:y=${y}:fontsize=${overlay.fontSize}:fontcolor=${overlay.color}:fontweight=${weight}`;
}

export function getTextPixelPosition(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number
): { left: number; top: number } {
  return {
    left: (x / 100) * containerWidth,
    top: (y / 100) * containerHeight,
  };
}

export function getTextPercentPosition(
  pixelX: number,
  pixelY: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  return {
    x: Math.min(100, Math.max(0, (pixelX / containerWidth) * 100)),
    y: Math.min(100, Math.max(0, (pixelY / containerHeight) * 100)),
  };
}

export function createDefaultTextOverlay(): TextOverlay {
  return {
    id: crypto.randomUUID(),
    text: "Text",
    x: 50,
    y: 50,
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "normal",
  };
}
