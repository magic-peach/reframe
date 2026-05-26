import { DEFAULT_RECIPE } from "./constants";
import { getPresetById } from "./presets";
import { EditRecipe } from "./types";
import { PREVIEW_CONTAINER_WIDTH, PREVIEW_CONTAINER_HEIGHT } from "./crop-frame";

export interface FrameExportSize {
  width: number;
  height: number;
}

export interface FrameExportTransform extends FrameExportSize {
  rotation: number;
  scale: number;
}

function resolveOutputSize(recipe: EditRecipe): FrameExportSize {
  if (recipe.preset === "custom") {
    return {
      width: recipe.customWidth,
      height: recipe.customHeight,
    };
  }

  return (
    getPresetById(recipe.preset) ?? {
      width: DEFAULT_RECIPE.customWidth,
      height: DEFAULT_RECIPE.customHeight,
    }
  );
}

export function getFrameExportTransform(
  recipe: EditRecipe,
  sourceWidth: number,
  sourceHeight: number
): FrameExportTransform {
  const { width, height } = resolveOutputSize(recipe);
  const rotated = recipe.rotate === 90 || recipe.rotate === 270;

  const fittedWidth = rotated ? sourceHeight : sourceWidth;
  const fittedHeight = rotated ? sourceWidth : sourceHeight;

  const scaleX = width / fittedWidth;
  const scaleY = height / fittedHeight;
  const scale = recipe.framing === "fit" ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);

  return {
    width,
    height,
    rotation: (recipe.rotate * Math.PI) / 180,
    scale,
  };
}

export function formatFrameExportFilename(date = new Date()): string {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `reframe-frame-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.png`;
}

export async function captureFrameAsPng(
  video: HTMLVideoElement,
  recipe: EditRecipe
): Promise<{ blob: Blob; width: number; height: number; filename: string }> {
  if (
    video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    throw new Error("The current frame is not ready yet.");
  }

  const { width, height, rotation, scale } = getFrameExportTransform(
    recipe,
    video.videoWidth,
    video.videoHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas export is not supported in this browser.");
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fit mode keeps the existing scale+letterbox behavior.
  if (recipe.framing === "fit") {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.drawImage(
      video,
      -video.videoWidth / 2,
      -video.videoHeight / 2,
      video.videoWidth,
      video.videoHeight
    );
    ctx.restore();
  } else {
    // Fill mode: rotate the source, crop according to the user selection box,
    // then scale the crop to the requested output size.
    const rotatedW = recipe.rotate === 90 || recipe.rotate === 270 ? video.videoHeight : video.videoWidth;
    const rotatedH = recipe.rotate === 90 || recipe.rotate === 270 ? video.videoWidth : video.videoHeight;

    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = rotatedW;
    rotCanvas.height = rotatedH;
    const rotCtx = rotCanvas.getContext("2d");
    if (!rotCtx) {
      throw new Error("Canvas export is not supported in this browser.");
    }

    rotCtx.fillStyle = "#000000";
    rotCtx.fillRect(0, 0, rotatedW, rotatedH);
    rotCtx.imageSmoothingEnabled = true;
    rotCtx.imageSmoothingQuality = "high";

    rotCtx.save();
    rotCtx.translate(rotatedW / 2, rotatedH / 2);
    rotCtx.rotate(rotation);
    rotCtx.drawImage(
      video,
      -video.videoWidth / 2,
      -video.videoHeight / 2,
      video.videoWidth,
      video.videoHeight
    );
    rotCtx.restore();

    const vcw = PREVIEW_CONTAINER_WIDTH;
    const vch = PREVIEW_CONTAINER_HEIGHT;
    const sc = Math.max(vcw / rotatedW, vch / rotatedH);
    const left = (vcw - rotatedW * sc) / 2;
    const top = (vch - rotatedH * sc) / 2;

    const boxX = recipe.cropBoxX * vcw;
    const boxY = recipe.cropBoxY * vch;
    const boxW = recipe.cropBoxW * vcw;
    const boxH = recipe.cropBoxH * vch;

    const cropX = Math.floor((boxX - left) / sc);
    const cropY = Math.floor((boxY - top) / sc);
    const cropW = Math.floor(boxW / sc);
    const cropH = Math.floor(boxH / sc);

    // Clamp for safety.
    const cx = Math.max(0, Math.min(rotatedW - 1, cropX));
    const cy = Math.max(0, Math.min(rotatedH - 1, cropY));
    const cw = Math.max(1, Math.min(rotatedW - cx, cropW));
    const ch = Math.max(1, Math.min(rotatedH - cy, cropH));

    ctx.drawImage(rotCanvas, cx, cy, cw, ch, 0, 0, width, height);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
        return;
      }

      reject(new Error("Could not create a PNG export."));
    }, "image/png");
  });

  return {
    blob,
    width,
    height,
    filename: formatFrameExportFilename(),
  };
}