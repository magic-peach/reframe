import { DEFAULT_RECIPE } from "./constants";
import { getPresetById } from "./presets";
import { EditRecipe } from "./types";

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