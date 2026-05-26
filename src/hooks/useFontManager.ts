/**
 * Hook for managing custom fonts in Reframe's text editor.
 * Handles font file uploads, validation, and registration.
 */

import { useCallback, useEffect, useState } from "react";
import { validateFontFile, extractFontName, detectDuplicateFonts } from "@/utils/fontValidation";
import {
  registerCustomFont,
  unregisterCustomFont,
  initializeFontRegistry,
  clearCustomFonts,
  ensureFontLoaded,
} from "@/utils/fontLoader";

export interface CustomFont {
  name: string; // Display name
  file: File; // Original font file
  blobUrl: string; // Blob URL for @font-face
}

interface UseFontManagerReturn {
  customFonts: CustomFont[];
  addFonts: (files: File[]) => Promise<{ success: number; errors: string[] }>;
  removeFont: (name: string) => void;
  getErrors: () => string[];
}

/**
 * Hook for managing custom fonts in the editor.
 * Handles validation, registration, and cleanup.
 *
 * @returns Object with methods to manage fonts and current font list
 *
 * @example
 * const { customFonts, addFonts, removeFont } = useFontManager();
 *
 * // Upload fonts
 * const result = await addFonts(fontFiles);
 * if (result.errors.length > 0) {
 *   console.error(result.errors);
 * }
 *
 * // Remove a font
 * removeFont("MyCustomFont");
 */
export function useFontManager(): UseFontManagerReturn {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize font registry on mount
  useEffect(() => {
    initializeFontRegistry();

    // Cleanup: unregister custom fonts on unmount
    return () => {
      clearCustomFonts();
    };
  }, []);

  /**
   * Adds font files to the manager after validation.
   * Automatically registers fonts in the DOM and ensures they're loaded.
   */
  const addFonts = useCallback(
    async (files: File[]): Promise<{ success: number; errors: string[] }> => {
      const newErrors: string[] = [];
      const validatedFonts: CustomFont[] = [];

      // Validate each file
      for (const file of files) {
        const validation = validateFontFile(file);

        if (!validation.valid) {
          newErrors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // Extract clean font name (already sanitized)
        const fontName = extractFontName(file.name);

        // Check for duplicate name
        if (customFonts.some((f) => f.name === fontName)) {
          newErrors.push(`${file.name}: Font "${fontName}" already uploaded`);
          continue;
        }

        // Create blob URL
        const blobUrl = URL.createObjectURL(file);

        // Register in DOM
        try {
          registerCustomFont(fontName, blobUrl);
          
          // Ensure font is loaded before allowing render
          // This prevents fallback font flashing
          await ensureFontLoaded(fontName, 16);
          
          validatedFonts.push({
            name: fontName,
            file,
            blobUrl,
          });
        } catch (err) {
          newErrors.push(
            `${file.name}: Failed to register font - ${err instanceof Error ? err.message : "Unknown error"}`
          );
          URL.revokeObjectURL(blobUrl);
        }
      }

      // Check for duplicate content
      if (validatedFonts.length > 1) {
        const duplicates = await detectDuplicateFonts(
          validatedFonts.map((f) => f.file)
        );
        if (duplicates.size > 0) {
          newErrors.push(
            `Duplicate fonts detected: ${Array.from(duplicates).join(", ")}`
          );
        }
      }

      // Update state
      setCustomFonts((prev) => [...prev, ...validatedFonts]);
      setErrors(newErrors);

      return {
        success: validatedFonts.length,
        errors: newErrors,
      };
    },
    [customFonts]
  );

  /**
   * Removes a custom font and cleans up resources.
   */
  const removeFont = useCallback((fontName: string) => {
    setCustomFonts((prev) => {
      const font = prev.find((f) => f.name === fontName);
      if (font) {
        // Revoke blob URL
        URL.revokeObjectURL(font.blobUrl);

        // Unregister from DOM
        unregisterCustomFont(fontName);
      }

      return prev.filter((f) => f.name !== fontName);
    });

    // Clear errors when removing fonts
    setErrors([]);
  }, []);

  return {
    customFonts,
    addFonts,
    removeFont,
    getErrors: () => errors,
  };
}
