export const PREVIEW_CONTAINER_ASPECT = 16 / 9;
export const PREVIEW_CONTAINER_WIDTH = 16;
export const PREVIEW_CONTAINER_HEIGHT = 9;

export interface CropBox {
  x: number; // top-left normalized [0..1]
  y: number; // top-left normalized [0..1]
  w: number; // width normalized [0..1]
  h: number; // height normalized [0..1]
}

/**
 * Returns the largest crop box with `outputAspect` that fits inside
 * a 16:9 preview container, centered.
 */
export function getCenteredMaxCropBox(outputAspect: number): CropBox {
  // width fraction and height fraction are relative to container width/height
  // so the pixel aspect ratio is:
  //   (w * containerW) / (h * containerH) = (w/h) * (containerW/containerH)
  //   => w/h = outputAspect / containerAspect
  const k = outputAspect / PREVIEW_CONTAINER_ASPECT;

  if (outputAspect >= PREVIEW_CONTAINER_ASPECT) {
    // box touches left/right
    const w = 1;
    const h = w / k;
    return { x: 0, y: (1 - h) / 2, w, h };
  }

  // box touches top/bottom
  const h = 1;
  const w = h * k;
  return { x: (1 - w) / 2, y: 0, w, h };
}

export function clampCropBox(box: CropBox, minW = 0.04, minH = 0.04): CropBox {
  let w = Math.max(minW, Math.min(1, box.w));
  let h = Math.max(minH, Math.min(1, box.h));

  // Keep aspect ratio constraints to caller; this clamp is only for bounds safety.
  // Ensure box fits within [0..1] range.
  const x = Math.min(Math.max(0, box.x), 1 - w);
  const y = Math.min(Math.max(0, box.y), 1 - h);

  return { x, y, w, h };
}

