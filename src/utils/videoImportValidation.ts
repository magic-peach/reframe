import { MAX_FILE_SIZE } from "@/lib/types";

export const SUPPORTED_VIDEO_FORMATS = "MP4, WebM, MOV, AVI, and MKV";

const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv"];

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

export function getUnsupportedVideoMessage(reason: string): string {
  return `${reason} Please choose a supported video file (${SUPPORTED_VIDEO_FORMATS}).`;
}

export function validateVideoFileBasics(file: File): VideoValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      error: getUnsupportedVideoMessage("This file is empty."),
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File too large. Maximum size is 2GB.",
    };
  }

  const filename = file.name.toLowerCase();
  const hasSupportedExtension = SUPPORTED_VIDEO_EXTENSIONS.some((extension) =>
    filename.endsWith(extension)
  );

  if (!hasSupportedExtension) {
    return {
      valid: false,
      error: getUnsupportedVideoMessage("This file type is not supported."),
    };
  }

  if (file.type && !file.type.startsWith("video/")) {
    return {
      valid: false,
      error: getUnsupportedVideoMessage(`The selected file is ${file.type}, not a video.`),
    };
  }

  return { valid: true };
}

export function isRecognizedVideoSignature(bytes: Uint8Array): boolean {
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const ascii = String.fromCharCode(...bytes);

  return (
    hex.startsWith("1A45DFA3") ||
    hex.startsWith("52494646") ||
    ascii.substring(0, 12).includes("ftyp")
  );
}

export function verifyVideoSignature(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (event) => {
      if (!event.target?.result) {
        resolve(false);
        return;
      }

      resolve(isRecognizedVideoSignature(new Uint8Array(event.target.result as ArrayBuffer)));
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

export function getMetadataImportErrorMessage(error: unknown): string {
  const detail = error instanceof Error ? error.message : "Unknown metadata error";

  return getUnsupportedVideoMessage(
    `Reframe could not read this video's metadata. The file may be corrupted or use an unsupported codec.`
  ) + ` (${detail})`;
}
