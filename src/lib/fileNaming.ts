const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

export function sanitizeFilenameBase(input: string): string {
  const cleaned = input
    .replace(INVALID_FILENAME_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  return cleaned || "reframe-video";
}

export function buildDownloadFilename(baseName: string, extension: string): string {
  return `${sanitizeFilenameBase(baseName)}.${extension}`;
}
