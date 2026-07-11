export const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mkv"];

export function hasSupportedVideoExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return SUPPORTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isAcceptableVideoCandidate(file: File): boolean {
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith("video/")) return true;
  if (mimeType === "" || mimeType === "application/octet-stream") return true;

  return hasSupportedVideoExtension(file.name);
}
