/**
 * Font loader utilities for dynamic font registration and preview rendering.
 * Handles @font-face registration and CSS class generation for custom fonts.
 */

/**
 * Built-in fonts available system-wide.
 * These are web-safe fonts that work across all browsers.
 */
export const BUILT_IN_FONTS = [
  { name: "Arial", family: "Arial, sans-serif" },
  { name: "Inter", family: "'Inter', sans-serif" },
  { name: "Roboto", family: "'Roboto', sans-serif" },
  { name: "Poppins", family: "'Poppins', sans-serif" },
  { name: "Montserrat", family: "'Montserrat', sans-serif" },
] as const;

/**
 * Map of font family names to their CSS family strings.
 */
type FontRegistry = Map<string, string>;

let fontRegistry: FontRegistry = new Map();

/**
 * Initializes the font registry with built-in fonts.
 *
 * @example
 * initializeFontRegistry();
 */
export function initializeFontRegistry(): void {
  fontRegistry.clear();
  BUILT_IN_FONTS.forEach(({ name, family }) => {
    fontRegistry.set(name, family);
  });
}

/**
 * Registers a custom font by creating a @font-face rule and adding it to the DOM.
 * Returns the font family name to use in CSS.
 *
 * IMPORTANT: The fontName should already be sanitized (alphanumeric + hyphens only).
 * Use extractFontName() from fontValidation.ts to prepare font names.
 *
 * @param fontName - Sanitized display name for the font (alphanumeric + hyphens)
 * @param fontBlobUrl - Blob URL or path to the font file
 * @returns The font family name to use in CSS
 *
 * @example
 * const sanitizedName = extractFontName("my-font.ttf"); // "MyFont"
 * const blobUrl = URL.createObjectURL(fontFile);
 * const fontFamily = registerCustomFont(sanitizedName, blobUrl);
 * element.style.fontFamily = fontFamily;
 */
export function registerCustomFont(fontName: string, fontBlobUrl: string): string {
  // Font name should already be sanitized, but ensure it is
  const safeFontName = fontName.replace(/[^a-zA-Z0-9-]/g, "") || "CustomFont";

  // Check if already registered
  if (fontRegistry.has(safeFontName)) {
    return fontRegistry.get(safeFontName)!;
  }

  // Detect font format from URL/extension
  let format = "truetype";
  if (fontBlobUrl.includes(".woff2")) format = "woff2";
  else if (fontBlobUrl.includes(".woff")) format = "woff";
  else if (fontBlobUrl.includes(".otf")) format = "opentype";

  // Create @font-face rule with improved font loading
  const fontFace = `
    @font-face {
      font-family: "${safeFontName}";
      src: url('${fontBlobUrl}') format('${format}');
      font-display: swap;
      font-weight: normal;
      font-style: normal;
    }
  `;

  // Inject into DOM
  const style = document.createElement("style");
  style.textContent = fontFace;
  style.setAttribute("data-font", safeFontName);
  document.head.appendChild(style);

  // Register in registry with proper CSS font-family
  // Note: Always quote the font name to handle font names with spaces or special chars
  const cssFontFamily = `"${safeFontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  fontRegistry.set(safeFontName, cssFontFamily);

  return cssFontFamily;
}

/**
 * Unregisters a custom font by removing its @font-face rule from the DOM.
 *
 * @param fontName - The font family name to unregister
 *
 * @example
 * unregisterCustomFont("MyFont");
 */
export function unregisterCustomFont(fontName: string): void {
  const safeFontName = fontName.replace(/[^a-zA-Z0-9-]/g, "");

  // Remove from registry
  fontRegistry.delete(safeFontName);

  // Remove @font-face rule from DOM
  const styles = document.querySelectorAll(`style[data-font="${safeFontName}"]`);
  styles.forEach((style) => style.remove());
}

/**
 * Gets the CSS font-family string for a registered font.
 * Returns the font-family value suitable for CSS use.
 *
 * For built-in fonts, returns the font family string from BUILT_IN_FONTS.
 * For custom fonts, looks up the font in the registry.
 * Falls back to a safely quoted generic font if not found.
 *
 * @param fontName - The font name to look up (should match font name from extractFontName)
 * @returns The CSS font-family string, or a fallback if not found
 *
 * @example
 * const fontFamily = getFontFamily("Inter");
 * element.style.fontFamily = fontFamily;
 * // Returns: "'Inter', sans-serif"
 *
 * const customFont = getFontFamily("MyCustomFont");
 * element.style.fontFamily = customFont;
 * // Returns: "'MyCustomFont', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
 */
export function getFontFamily(fontName?: string): string {
  if (!fontName) return "Arial, sans-serif";

  // Check if it's a built-in font first
  const builtIn = BUILT_IN_FONTS.find(({ name }) => name === fontName);
  if (builtIn) {
    return builtIn.family;
  }

  // Check if it's in the custom font registry
  const registered = fontRegistry.get(fontName);
  if (registered) {
    return registered;
  }

  // Fallback: return a safely quoted font name with system fallback
  // This ensures the font name is properly formatted even if not registered
  return `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
}

/**
 * Gets all registered font names.
 *
 * @returns Array of font names currently registered
 *
 * @example
 * const fonts = getRegisteredFonts();
 * console.log(fonts); // ["Arial", "Inter", "MyCustomFont", ...]
 */
export function getRegisteredFonts(): string[] {
  return Array.from(fontRegistry.keys());
}

/**
 * Clears all custom fonts (keeps built-in fonts).
 * Useful for cleanup when unmounting or resetting editor state.
 *
 * @example
 * clearCustomFonts();
 */
export function clearCustomFonts(): void {
  const builtInNames = BUILT_IN_FONTS.map(({ name }) => name) as string[];
  const customFonts = Array.from(fontRegistry.keys()).filter(
    (name) => !builtInNames.includes(name)
  );

  customFonts.forEach((font) => {
    unregisterCustomFont(font);
  });
}

/**
 * Generates FFmpeg-compatible font file argument for drawtext filter.
 * If font is built-in, returns empty string (FFmpeg handles system fonts).
 * If font is custom, returns the fontfile path parameter.
 *
 * @param fontName - Font family name
 * @param fontPath - Path to font file (for custom fonts)
 * @returns FFmpeg fontfile parameter or empty string
 *
 * @example
 * const fontArg = getFFmpegFontArg("CustomFont", "/path/to/font.ttf");
 * // Returns: "fontfile=/path/to/font.ttf"
 *
 * const fontArg = getFFmpegFontArg("Arial");
 * // Returns: ""
 */
export function getFFmpegFontArg(fontName?: string, fontPath?: string): string {
  if (!fontName) return "";

  // Built-in fonts don't need explicit fontfile parameter
  const builtInNames = BUILT_IN_FONTS.map(({ name }) => name) as string[];
  if (builtInNames.includes(fontName)) {
    return "";
  }

  // Custom fonts need the fontfile parameter
  if (fontPath) {
    // Escape colons in path for FFmpeg
    const escapedPath = fontPath.replace(/:/g, "\\:");
    return `fontfile=${escapedPath}`;
  }

  return "";
}

/**
 * Ensures a font is fully loaded in the browser before rendering.
 * This prevents fallback fonts from flashing during initial render.
 * 
 * For custom fonts, waits for the font to load via document.fonts API.
 * For built-in fonts (system or Google Fonts), ensures they're available.
 *
 * @param fontName - Font family name to ensure is loaded
 * @param fontSize - Font size in pixels (used for load verification)
 * @returns Promise that resolves when font is ready
 *
 * @example
 * await ensureFontLoaded("MyCustomFont", 16);
 * // Now safe to render with this font
 */
export async function ensureFontLoaded(
  fontName?: string,
  fontSize: number = 16
): Promise<void> {
  if (!fontName) return;

  // Built-in fonts (Arial, system fonts) are always available
  if (fontName === "Arial") {
    return;
  }

  // Google Fonts and built-in web fonts (Inter, Roboto, Poppins, Montserrat)
  const builtInNames = BUILT_IN_FONTS.map(({ name }) => name) as string[];
  if (builtInNames.includes(fontName)) {
    // These are loaded via @import in globals.css, so they should be ready
    // But try to load them anyway to ensure they're available
    try {
      const fontDescriptor = `${fontSize}px "${fontName}"`;
      // Use a short timeout to avoid hanging if font doesn't load
      const loadPromise = document.fonts.load(fontDescriptor);
      await Promise.race([
        loadPromise,
        new Promise(resolve => setTimeout(resolve, 1000)) // 1 second timeout
      ]);
    } catch (err) {
      // Silently continue if font loading fails
      // These fonts should be available from CSS import
    }
    return;
  }

  // For custom fonts, wait for them to load via document.fonts
  try {
    // Build font descriptor string for document.fonts.load()
    const fontDescriptor = `${fontSize}px "${fontName}"`;
    
    // Request the font to load
    await document.fonts.load(fontDescriptor);
  } catch (err) {
    // Silently continue if font loading fails
    // The browser will use fallback fonts
    console.warn(`Font "${fontName}" failed to load:`, err);
  }
}
