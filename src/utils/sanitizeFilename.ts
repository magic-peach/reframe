/**
 * Sanitizes a filename by removing or replacing invalid filesystem characters.
 *
 * Removes:
 * - Windows forbidden characters: < > : " / \ | ? *
 * - Leading/trailing periods and spaces
 * - Control characters and newlines
 *
 * Replaces:
 * - Multiple consecutive spaces with single space
 * - Sequences of invalid characters with single dash
 *
 * @param filename - Raw user input for filename
 * @param fallback - Default filename if input becomes empty (default: "reframe-video")
 * @returns Sanitized, filesystem-safe filename
 *
 * @example
 * sanitizeFilename("my/video:*test") → "my-video-test"
 * sanitizeFilename("file  with   spaces") → "file with spaces"
 * sanitizeFilename("...hidden") → "hidden"
 * sanitizeFilename("") → "reframe-video"
 */
export function sanitizeFilename(
  filename: string,
  fallback: string = "reframe-video"
): string {
  if (!filename || typeof filename !== "string") {
    return fallback;
  }

  // Remove forbidden Windows/Unix filesystem characters and control characters
  let sanitized = filename
    // Remove Windows forbidden characters: < > : " / \ | ? *
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    // Replace multiple consecutive dashes with single dash
    .replace(/-+/g, "-")
    // Replace multiple consecutive spaces with single space
    .replace(/\s+/g, " ")
    // Remove leading/trailing periods (hidden files on Unix, forbidden on Windows)
    .replace(/^\.+|\.+$/g, "")
    // Remove leading/trailing spaces
    .trim();

  // If sanitization resulted in empty string, use fallback
  if (!sanitized || sanitized === "" || /^-+$/.test(sanitized)) {
    return fallback;
  }

  // Limit to 200 characters (safe for all filesystems; browsers may limit further)
  return sanitized.substring(0, 200);
}

/**
 * Checks if a filename is valid (contains at least one alphanumeric character).
 *
 * @param filename - Filename to validate
 * @returns true if filename is valid, false otherwise
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || typeof filename !== "string") {
    return false;
  }
  // Check if filename has at least one alphanumeric character
  return /[a-zA-Z0-9]/.test(filename);
}
