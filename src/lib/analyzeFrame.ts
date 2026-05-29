/**
 * Client‑side smart crop analyzer.
 * Draws a video frame onto a canvas, scans a grid of possible
 * crop windows to find the one with the highest visual activity
 * (brightness variance = edges/detail = likely subject area).
 */

export async function analyzeBestCropRegion(
  videoFile: File,
  targetAspectRatio: number // e.g. 9/16 ≈ 0.5625 for portrait
): Promise<{ cropX: number; cropY: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.muted = true;
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.max(0.1, video.duration * 0.1);
    });

    video.addEventListener('seeked', () => {
      try {
        const W = 320;
        const H = 180;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ cropX: 0.5, cropY: 0.5 });
          return;
        }

        ctx.drawImage(video, 0, 0, W, H);
        const imageData = ctx.getImageData(0, 0, W, H);

        const result = findBestCropWindow(imageData, W, H, targetAspectRatio);
        URL.revokeObjectURL(url);
        resolve(result);
      } catch {
        URL.revokeObjectURL(url);
        resolve({ cropX: 0.5, cropY: 0.5 }); // safe fallback
      }
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve({ cropX: 0.5, cropY: 0.5 });
    });

    video.load();
  });
}

function findBestCropWindow(
  imageData: ImageData,
  W: number,
  H: number,
  targetAspect: number
): { cropX: number; cropY: number } {
  // Size of the crop window in the 320x180 canvas space
  let cropW: number, cropH: number;
  const sourceAspect = W / H;

  if (targetAspect < sourceAspect) {
    // Target is taller → crop width
    cropH = H;
    cropW = Math.round(H * targetAspect);
  } else {
    // Target is wider → crop height
    cropW = W;
    cropH = Math.round(W / targetAspect);
  }

  cropW = Math.min(cropW, W);
  cropH = Math.min(cropH, H);

  const GRID = 8; // 8×8 = 64 candidates
  let bestScore = -1;
  let bestCX = 0.5;
  let bestCY = 0.5;

  for (let gy = 0; gy <= GRID; gy++) {
    for (let gx = 0; gx <= GRID; gx++) {
      const startX = Math.round((gx / GRID) * (W - cropW));
      const startY = Math.round((gy / GRID) * (H - cropH));
      const score = computeActivityScore(imageData.data, W, startX, startY, cropW, cropH);

      if (score > bestScore) {
        bestScore = score;
        bestCX = (startX + cropW / 2) / W;
        bestCY = (startY + cropH / 2) / H;
      }
    }
  }

  return {
    cropX: Math.max(0, Math.min(1, bestCX)),
    cropY: Math.max(0, Math.min(1, bestCY)),
  };
}

/** Variance of pixel brightness → higher = more detail/edges */
function computeActivityScore(
  data: Uint8ClampedArray,
  W: number,
  x: number,
  y: number,
  w: number,
  h: number
): number {
  const STEP = 3;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let py = y; py < y + h; py += STEP) {
    for (let px = x; px < x + w; px += STEP) {
      const i = (py * W + px) * 4;
      const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += brightness;
      sumSq += brightness * brightness;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  return sumSq / count - mean * mean; // variance
}