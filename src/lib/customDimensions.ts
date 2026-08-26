const MIN_DIMENSION = 16;
const MAX_DIMENSION = 7680;

export function clampCustomDimension(value: number): number {
  return Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, Math.round(value)));
}

export function getLockedCustomDimensions(
  axis: "width" | "height",
  nextValue: number,
  aspectRatio: number | null,
  currentWidth: number,
  currentHeight: number,
): { customWidth: number; customHeight: number } {
  const clampedValue = clampCustomDimension(nextValue);

  if (!aspectRatio || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return axis === "width"
      ? { customWidth: clampedValue, customHeight: currentHeight }
      : { customWidth: currentWidth, customHeight: clampedValue };
  }

  if (axis === "width") {
    return {
      customWidth: clampedValue,
      customHeight: clampCustomDimension(clampedValue / aspectRatio),
    };
  }

  return {
    customWidth: clampCustomDimension(clampedValue * aspectRatio),
    customHeight: clampedValue,
  };
}
