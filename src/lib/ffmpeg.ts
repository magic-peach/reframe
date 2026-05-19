import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { ProgressEventCallback } from "@ffmpeg/ffmpeg";
import { EditRecipe, ExportResult } from "./types";
import { getPresetById } from "./presets";

const CORE_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

let ffmpegInstance: FFmpeg | null = null;

export function terminateFFmpegEngine(): void {
  if (!ffmpegInstance) return;
  try {
    ffmpegInstance.terminate();
  } catch {
    /* worker may already be gone */
  }
  ffmpegInstance = null;
}

export async function loadFFmpeg(signal?: AbortSignal): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  try {
    await ffmpeg.load(
      {
        coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      },
      { signal }
    );
  } catch (err) {
    try {
      ffmpeg.terminate();
    } catch {
      /* noop */
    }
    throw err;
  }

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

function buildVideoFilter(recipe: EditRecipe, targetW: number, targetH: number): string {
  const filters: string[] = [];

  if (recipe.trimStart > 0 || recipe.trimEnd !== null) {
    const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
    filters.push(`trim=start=${recipe.trimStart}:end=${end}`);
    filters.push("setpts=PTS-STARTPTS");
  }

  if (recipe.rotate === 90) {
    filters.push("transpose=1");
  } else if (recipe.rotate === 180) {
    filters.push("transpose=1,transpose=1");
  } else if (recipe.rotate === 270) {
    filters.push("transpose=2");
  }

  if (recipe.framing === "fit") {
    filters.push(
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease`,
      `pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:color=black`
    );
  } else {
    filters.push(
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase`,
      `crop=${targetW}:${targetH}`
    );
  }

  if (recipe.speed !== 1) {
    const pts = (1 / recipe.speed).toFixed(4);
    filters.push(`setpts=${pts}*PTS`);
  }

  return filters.join(",");
}

function buildAudioFilter(speed: number): string {
  if (speed === 1) return "";
  if (speed === 0.25) return "atempo=0.5,atempo=0.5";
  if (speed === 4) return "atempo=2.0,atempo=2.0";
  return `atempo=${speed}`;
}

function buildAudioTrimFilter(recipe: EditRecipe): string {
  if (recipe.trimStart === 0 && recipe.trimEnd === null) return "";
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

export type ExportVideoOptions = {
  signal?: AbortSignal;
};

export function buildExportFilename(
  presetId: string,
  _width: number,
  _height: number,
  format: "mp4" | "webm"
): string {
  return `${presetId}.${format}`;
}

async function safeDeleteFile(ffmpeg: FFmpeg, path: string): Promise<void> {
  try {
    await ffmpeg.deleteFile(path);
  } catch {
    /* file may not exist if export failed mid-flight */
  }
}

export async function exportVideo(
  ffmpeg: FFmpeg,
  file: File,
  recipe: EditRecipe,
  onProgressPercent: (percent: number) => void,
  options?: ExportVideoOptions
): Promise<ExportResult> {
  const { signal } = options ?? {};

  let targetW: number, targetH: number;
  if (recipe.preset === "custom") {
    targetW = recipe.customWidth;
    targetH = recipe.customHeight;
  } else {
    const preset = getPresetById(recipe.preset);
    targetW = preset?.width ?? 1920;
    targetH = preset?.height ?? 1080;
  }

  targetW = Math.round(targetW / 2) * 2;
  targetH = Math.round(targetH / 2) * 2;

  const ext = file.name.split(".").pop() ?? "mp4";
  const jobId = crypto.randomUUID().slice(0, 10);
  const inputName = `in_${jobId}.${ext}`;
  const outputName = `out_${jobId}.mp4`;
  const webmOutput = `out_${jobId}.webm`;

  const onProgress: ProgressEventCallback = ({ progress }) => {
    onProgressPercent(Math.min(99, Math.round(progress * 100)));
  };

  ffmpeg.on("progress", onProgress);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file), { signal });

    const vf = buildVideoFilter(recipe, targetW, targetH);
    const audioTrim = buildAudioTrimFilter(recipe);
    const audioSpeed = buildAudioFilter(recipe.speed);
    const afParts = [audioTrim, audioSpeed].filter(Boolean);
    const af = afParts.join(",");

    const args = ["-i", inputName];
    if (vf) args.push("-vf", vf);

    if (!recipe.keepAudio) {
      args.push("-an");
    } else if (af) {
      args.push("-af", af);
    }

    args.push(
      "-c:v",
      "libx264",
      "-crf",
      String(recipe.quality),
      "-preset",
      "medium",
      "-movflags",
      "+faststart"
    );

    if (recipe.keepAudio) {
      args.push("-c:a", "aac", "-b:a", "128k");
    }

    args.push(outputName);

    const exitCode = await ffmpeg.exec(args, undefined, { signal });

    if (exitCode !== 0) {
      const fallbackArgs = [
        "-i",
        inputName,
        ...(vf ? ["-vf", vf] : []),
        ...(recipe.keepAudio ? (af ? ["-af", af] : []) : ["-an"]),
        "-c:v",
        "libvpx-vp9",
        "-crf",
        String(recipe.quality),
        ...(recipe.keepAudio ? ["-c:a", "libopus"] : []),
        webmOutput,
      ];

      const fallbackCode = await ffmpeg.exec(fallbackArgs, undefined, { signal });
      if (fallbackCode !== 0) throw new Error("Export failed");

      const data = await ffmpeg.readFile(webmOutput, undefined, { signal });
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/webm" });
      await safeDeleteFile(ffmpeg, inputName);
      await safeDeleteFile(ffmpeg, webmOutput);

      onProgressPercent(100);
      return {
        blobUrl: URL.createObjectURL(blob),
        size: blob.size,
        width: targetW,
        height: targetH,
        format: "webm",
      };
    }

    const data = await ffmpeg.readFile(outputName, undefined, { signal });
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
    await safeDeleteFile(ffmpeg, inputName);
    await safeDeleteFile(ffmpeg, outputName);

    onProgressPercent(100);
    return {
      blobUrl: URL.createObjectURL(blob),
      size: blob.size,
      width: targetW,
      height: targetH,
      format: "mp4",
    };
  } catch (err) {
    await safeDeleteFile(ffmpeg, inputName);
    await safeDeleteFile(ffmpeg, outputName);
    await safeDeleteFile(ffmpeg, webmOutput);
    throw err;
  } finally {
    try {
      ffmpeg.off("progress", onProgress);
    } catch {
      /* noop */
    }
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
