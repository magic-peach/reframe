import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { EditRecipe, ExportResult } from "./types";
import { getPresetById } from "./presets";
import { simd } from "wasm-feature-detect";

// Looks at your local public folder instead of an external CDN
const CORE_BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

let ffmpegInstance: FFmpeg | null = null;

/**
 * Error thrown when the FFmpeg WebAssembly core fails to load.
 */
export class FFmpegLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FFmpegLoadError";
  }
}

export async function loadFFmpeg(signal?: AbortSignal): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  const ffmpeg = ffmpegInstance ?? new FFmpeg();
  ffmpegInstance = ffmpeg;

  try {
    // Points directly to the local files you dragged into the public folder
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
    }, { signal });

    return ffmpeg;
  } catch (err) {
    if (ffmpegInstance === ffmpeg) {
      ffmpegInstance = null;
    }
    throw new FFmpegLoadError("The ffmpeg cdn could not load. Please check your internet connection.");
  }
}

export function terminateFFmpeg() {
  ffmpegInstance?.terminate();
  ffmpegInstance = null;
}

function buildSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  filters.push(
    `eq=brightness=${recipe.brightness}:contrast=${recipe.contrast}:saturation=${recipe.saturation}`
  );
  return filters.join(",");
}

export function buildAudioFilter(speed: number): string {
  if (speed === 1) return "";

  const filters: string[] = [];
  let remaining = speed;

  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }

  while (remaining > 2.0) {
    filters.push("atempo=2.0");
    remaining /= 2.0;
  }

  if (Math.abs(remaining - 1.0) > 0.001) {
    filters.push(`atempo=${Number(remaining.toFixed(4))}`);
  }

  return filters.join(",");
}

function buildAudioTrimFilter(recipe: EditRecipe): string {
  if (recipe.trimStart === 0 && recipe.trimEnd === null) return "";
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

export async function exportVideo(
  ffmpeg: FFmpeg,
  file: File,
  recipe: EditRecipe,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<ExportResult> {
  const sessionId = buildSessionId();
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
  const inputName = `input_${sessionId}.${ext}`;
  
  const bgExt = recipe.bgMusicFile?.name.split(".").pop() ?? "mp3";
  const bgInputName = `bg_${sessionId}.${bgExt}`;

  const getOutputConfig = (format: string) => {
    switch (format) {
      case "webm":
        return { filename: `output_${sessionId}.webm`, mimeType: "video/webm" };
      case "mkv":
        return { filename: `output_${sessionId}.mkv`, mimeType: "video/x-matroska" };
      default:
        return { filename: `output_${sessionId}.mp4`, mimeType: "video/mp4" };
    }
  };

  const { filename: outputName, mimeType } = getOutputConfig(recipe.format);
  const fallbackOutputName = `fallback_${sessionId}.webm`;
  const cleanupFiles = new Set<string>([inputName, outputName, fallbackOutputName]);
  if (recipe.bgMusicFile) cleanupFiles.add(bgInputName);

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  };

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file), { signal });

    if (recipe.bgMusicFile) {
      await ffmpeg.writeFile(bgInputName, await fetchFile(recipe.bgMusicFile), { signal });
    }

    ffmpeg.on("progress", handleProgress);

    const vf = buildVideoFilter(recipe, targetW, targetH);
    const args: string[] = [];

    args.push("-i", inputName);
    
    if (recipe.bgMusicFile) {
      if (recipe.loopBgMusic) {
        args.push("-stream_loop", "-1");
      }
      args.push("-i", bgInputName);
    }

    if (vf) args.push("-vf", vf);

    if (recipe.bgMusicFile) {
      const vVol = recipe.keepAudio ? (recipe.videoVolume ?? 1.0) : 0;
      const bgVol = recipe.bgMusicVolume ?? 1.0;

      const audioTrim = buildAudioTrimFilter(recipe);
      const audioSpeed = buildAudioFilter(recipe.speed);
      const afParts = [audioTrim, audioSpeed].filter(Boolean);
      const videoAudioBaseFilter = afParts.length > 0 ? `${afParts.join(",")},` : "";

      const filterComplexString = `[0:a]${videoAudioBaseFilter}volume=${vVol}[a1];[1:a]volume=${bgVol}[a2];[a1][a2]amix=inputs=2:duration=first[a]`;
      args.push("-filter_complex", filterComplexString, "-map", "0:v", "-map", "[a]");
    } else {
      const audioTrim = buildAudioTrimFilter(recipe);
      const audioSpeed = buildAudioFilter(recipe.speed);
      const afParts = [audioTrim, audioSpeed].filter(Boolean);
      const af = afParts.join(",");

      if (!recipe.keepAudio) {
        args.push("-an");
      } else if (af) {
        args.push("-af", af);
      }
    }

    if (recipe.format === "webm") {
      args.push("-c:v", "libvpx-vp9", "-crf", String(recipe.quality));
      if (recipe.keepAudio || recipe.bgMusicFile) args.push("-c:a", "libopus");
    } else if (recipe.format === "mkv") {
      args.push("-c:v", "libx264", "-crf", String(recipe.quality), "-preset", "medium");
      if (recipe.keepAudio || recipe.bgMusicFile) args.push("-c:a", "aac", "-b:a", "128k");
    } else {
      args.push("-c:v", "libx264", "-crf", String(recipe.quality), "-preset", "medium", "-movflags", "+faststart");
      if (recipe.keepAudio || recipe.bgMusicFile) args.push("-c:a", "aac", "-b:a", "128k");
    }

    args.push(outputName);

    const exitCode = await ffmpeg.exec(args, undefined, { signal });

    if (exitCode !== 0) {
      throw new Error("Export failed");
    }

    const data = await ffmpeg.readFile(outputName, undefined, { signal });
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: mimeType });

    onProgress(100);
    return {
      blobUrl: URL.createObjectURL(blob),
      size: blob.size,
      width: targetW,
      height: targetH,
      format: recipe.format as "mp4" | "webm" | "mkv",
    };
  } finally {
    ffmpeg.off("progress", handleProgress);
    for (const path of cleanupFiles) {
      try {
        await ffmpeg.deleteFile(path);
      } catch {}
    }
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}