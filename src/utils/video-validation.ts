// src/utils/video-validation.ts

export const MAX_4K_PIXELS = 3840 * 2160; 
export const MAX_8K_PIXELS = 7680 * 7680; 

export type ValidationResult = 'safe' | 'warning' | 'blocked';

/**
 * Validates whether the browser engine can safely process the input resolution.
 */
export function validateDimensions(width: number, height: number): ValidationResult {
  if (!width || !height || isNaN(width) || isNaN(height)) return 'blocked';
  
  const pixels = width * height;
  
  if (pixels > MAX_8K_PIXELS) return 'blocked';
  if (pixels > MAX_4K_PIXELS) return 'warning';
  
  return 'safe';
}

/**
 * Downscales video dimensions to fit exactly within a 4K pixel area ceiling
 * while strictly maintaining the original aspect ratio and enforcing even pixel boundaries.
 */
export function getDownscaledDimensions(width: number, height: number) {
  if (!width || !height || isNaN(width) || isNaN(height)) {
    return { width: 1920, height: 1080 }; // Safe standard fallback
  }

  const aspectRatio = width / height;
  const newHeight = Math.sqrt(MAX_4K_PIXELS / aspectRatio);
  const newWidth = newHeight * aspectRatio;
  
  // Enforce even dimensions (multiples of 2) to ensure strict FFmpeg macroblock compatibility
  return {
    width: Math.floor(newWidth / 2) * 2,
    height: Math.floor(newHeight / 2) * 2
  };
}