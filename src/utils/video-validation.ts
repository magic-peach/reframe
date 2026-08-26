// src/utils/video-validation.ts

export const MAX_4K_PIXELS = 3840 * 2160;
export const MAX_8K_PIXELS = 7680 * 7680;

export const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"] as const;

export type ValidationResult = "safe" | "warning" | "blocked";

export type VideoFileValidationResult = { valid: true } | { valid: false; error: string };

export function validateDimensions(width: number, height: number): ValidationResult {
  const pixels = width * height;

  if (pixels > MAX_8K_PIXELS) return "blocked";
  if (pixels > MAX_4K_PIXELS) return "warning";

  return "safe";
}

export function getDownscaledDimensions(width: number, height: number) {
  const aspectRatio = width / height;
  const newHeight = Math.sqrt(MAX_4K_PIXELS / aspectRatio);
  const newWidth = newHeight * aspectRatio;

  return {
    width: Math.floor(newWidth / 2) * 2,
    height: Math.floor(newHeight / 2) * 2,
  };
}

function hasSupportedVideoExtension(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return SUPPORTED_VIDEO_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function hasSupportedVideoMimeType(mimeType: string): boolean {
  return mimeType.toLowerCase().startsWith("video/");
}

function matchesMp4OrMovSignature(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
}

function matchesAviSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "AVI "
  );
}

function matchesMatroskaSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  );
}

function hasKnownVideoMagicBytes(bytes: Uint8Array): boolean {
  return matchesMp4OrMovSignature(bytes) || matchesAviSignature(bytes) || matchesMatroskaSignature(bytes);
}

export async function validateVideoFile(file: File): Promise<VideoFileValidationResult> {
  if (!hasSupportedVideoExtension(file.name)) {
    return {
      valid: false,
      error: "Invalid video extension. Use .mp4, .mov, .avi, .mkv, or .webm.",
    };
  }

  if (!hasSupportedVideoMimeType(file.type)) {
    return {
      valid: false,
      error: `Invalid Content-Type. Expected a video MIME type, got ${file.type || "unknown"}.`,
    };
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!hasKnownVideoMagicBytes(header)) {
    return {
      valid: false,
      error: "File contents do not match a supported video format.",
    };
  }

  return { valid: true };
}
