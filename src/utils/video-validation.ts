// src/utils/video-validation.ts

export const MAX_4K_WIDTH = 3840
export const MAX_4K_HEIGHT = 2160
export const MAX_4K_PIXELS = MAX_4K_WIDTH * MAX_4K_HEIGHT

export const MAX_8K_WIDTH = 7680
export const MAX_8K_HEIGHT = 4320
export const MAX_8K_PIXELS = MAX_8K_WIDTH * MAX_8K_HEIGHT

export type ValidationResult = 'safe' | 'warning' | 'blocked';

export function validateDimensions(width: number, height: number): ValidationResult {
  if (width > MAX_8K_WIDTH || height > MAX_8K_HEIGHT) return 'blocked'
  if (width > MAX_4K_WIDTH || height > MAX_4K_HEIGHT) return 'warning'

  return 'safe'
}

export function getDownscaledDimensions(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return {
      width: 0,
      height: 0,
    }
  }

  const scale = Math.min(MAX_4K_WIDTH / width, MAX_4K_HEIGHT / height)
  const newWidth = width * scale
  const newHeight = height * scale

  return {
    width: Math.floor(newWidth / 2) * 2,
    height: Math.floor(newHeight / 2) * 2,
  }
}
