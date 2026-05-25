// src/utils/video-validation.ts

export const MAX_4K_PIXELS = 3840 * 2160; 
export const MAX_8K_PIXELS = 7680 * 7680; 

export type ValidationResult = 'safe' | 'warning' | 'blocked';

export function validateDimensions(width: number, height: number): ValidationResult {
  const pixels = width * height;
  
  if (pixels > MAX_8K_PIXELS) return 'blocked';
  if (pixels > MAX_4K_PIXELS) return 'warning';
  
  return 'safe';
}

export function getDownscaledDimensions(width: number, height: number) {
  const aspectRatio = width / height;
  const newHeight = Math.sqrt(MAX_4K_PIXELS / aspectRatio);
  const newWidth = newHeight * aspectRatio;
  
  return {
    width: Math.floor(newWidth / 2) * 2,
    height: Math.floor(newHeight / 2) * 2
  };
}