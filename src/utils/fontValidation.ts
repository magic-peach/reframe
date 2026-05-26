/**
 * Font validation utilities for custom font uploads.
 * Validates font file formats, sizes, and handles duplicate detection.
 */

const SUPPORTED_FONT_FORMATS = ["font/ttf", "font/otf", "font/woff", "font/woff2"];
const MAX_FONT_SIZE_MB = 5;
const MAX_FONT_SIZE_BYTES = MAX_FONT_SIZE_MB * 1024 * 1024;

/**
 * Validates a font file for format, size, and corruption.
 *
 * @param file - The font file to validate
 * @returns { valid: boolean, error?: string } - Validation result with optional error message
 *
 * @example
 * const result = validateFontFile(file);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export function validateFontFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  const mimeType = file.type;
  if (!SUPPORTED_FONT_FORMATS.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported font format. Supported: TTF, OTF, WOFF, WOFF2. Got: ${mimeType || "unknown"}`,
    };
  }

  // Check file extension as secondary validation
  const fileName = file.name.toLowerCase();
  const validExtensions = [".ttf", ".otf", ".woff", ".woff2"];
  const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Use .ttf, .otf, .woff, or .woff2`,
    };
  }

  // Check file size
  if (file.size > MAX_FONT_SIZE_BYTES) {
    return {
      valid: false,
      error: `Font file too large. Maximum size: ${MAX_FONT_SIZE_MB}MB, got: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // File must not be empty
  if (file.size === 0) {
    return {
      valid: false,
      error: `Font file is empty`,
    };
  }

  return { valid: true };
}

/**
 * Extracts a clean font name from a filename.
 * Removes extension and replaces underscores/hyphens with spaces.
 * Uses same sanitization logic as fontLoader for consistency.
 *
 * @param fileName - The font file name
 * @returns Clean font name suitable for UI display and CSS
 *
 * @example
 * extractFontName("Open_Sans.ttf") // Returns "OpenSans"
 * extractFontName("my-font.woff") // Returns "MyFont"
 */
export function extractFontName(fileName: string): string {
  // Remove extension
  const withoutExt = fileName.replace(/\.[^.]*$/, "");
  
  // Apply same sanitization as registerCustomFont for consistency
  // Only keep alphanumeric and hyphens
  const sanitized = withoutExt.replace(/[^a-zA-Z0-9-]/g, "");
  
  // Convert to PascalCase for display if needed
  const cleaned = sanitized
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
  
  return cleaned || "CustomFont";
}

/**
 * Detects duplicate fonts by comparing file content hashes.
 * Uses simple byte comparison as a quick duplicate check.
 *
 * @param files - Array of font files to check
 * @returns Set of file names that are duplicates
 *
 * @example
 * const duplicates = await detectDuplicateFonts([file1, file2, file3]);
 * if (duplicates.size > 0) {
 *   console.warn("Duplicate fonts detected:", duplicates);
 * }
 */
export async function detectDuplicateFonts(files: File[]): Promise<Set<string>> {
  const fileHashes = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    // Simple hash: first 100 bytes + file size
    const view = new Uint8Array(buffer);
    const sample = Array.from(view.slice(0, 100)).join(",");
    const hash = `${sample}:${file.size}`;

    if (fileHashes.has(hash)) {
      duplicates.add(file.name);
      duplicates.add(fileHashes.get(hash)!);
    } else {
      fileHashes.set(hash, file.name);
    }
  }

  return duplicates;
}
