import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { EditRecipe, ExportResult, BackgroundMusicOptions, ImageOverlayOptions } from "./types";
import { getPresetById } from "./presets";
import { buildTextFilter } from "./text-overlay";
import { simd } from "wasm-feature-detect";

const CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

// Added from main branch for subresource security verification
const SRI_HASHES: Record<string, string> = {
  "ffmpeg-core.js":   "sha384-sKfkiFtvUk+vexk+0EUhEh366190/4WpgUAsUvaxEfyg7+E1Zt5Y5hrsU808g8Q9",
  "ffmpeg-core.wasm": "sha384-U1VDhkPYrM3wTCT4/vjSpSsKqG/UjljYrYCI4hBSJ02svbCkxuCi6U6u/peg5vpW",
};

// Added from main branch to perform secure binary verification
async function fetchWithIntegrity(url: string, mimeType: string): Promise<string> {
  const key = url.split("/").pop()!;
  const integrity = SRI_HASHES[key];

  if (!integrity) {
    throw new Error(`[SRI] No hash found for: ${key}`);
  }

  const res = await fetch(url, { integrity, credentials: "omit" });
  const blob = new Blob([await res.arrayBuffer()], { type: mimeType });
  return URL.createObjectURL(blob);
}

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

export async function loadFFmpeg(
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    onProgress?.(100);
    return ffmpegInstance;
  }

  const ffmpeg = ffmpegInstance ?? new FFmpeg();
  ffmpegInstance = ffmpeg;

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress?.(Math.round(progress * 100));
  };

  try {
    ffmpeg.on("progress", handleProgress);

    const isIsolated = typeof self !== "undefined" && self.crossOriginIsolated;
    const baseURL = isIsolated
      ? "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm"
      : "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      ...(isIsolated && {
        workerURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.worker.js`,
          "text/javascript"
        ),
      }),
    }, { signal });

    onProgress?.(100);
    return ffmpeg;
  } catch (err) {
    if (ffmpegInstance === ffmpeg) {
      ffmpegInstance = null;
    }
    throw new FFmpegLoadError("Failed to load the FFmpeg engine. Check your internet connection.");
  } finally {
    ffmpeg.off("progress", handleProgress);
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

export function buildVideoFilter(recipe: EditRecipe, targetW: number, targetH: number): string {
  const filters: string[] = [];

  if (recipe.trimStart > 0 || recipe.trimEnd !== null) {
    const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
    filters.push(`trim=start=${recipe.trimStart}:end=${end}`);
  }

  if (recipe.stabilization) {
    filters.push("deshake");
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

  // Normalize timestamps only when needed — trim or speed change both
  // require a clean 0-based timeline to produce correct output duration.
  if (recipe.trimStart > 0 || recipe.trimEnd !== null || recipe.speed !== 1) {
    filters.push("setpts=PTS-STARTPTS");
  }

  if (recipe.speed !== 1) {
    const pts = (1 / recipe.speed).toFixed(4);
    filters.push(`setpts=${pts}*PTS`);
  }

  if (recipe.denoise) {
    filters.push("hqdn3d=1.5:1.5:6:6");
  }

  const needsEq =
    recipe.brightness !== 0 ||
    recipe.contrast !== 1 ||
    recipe.saturation !== 1;

  if (needsEq) {
    filters.push(
      `eq=brightness=${recipe.brightness}:contrast=${recipe.contrast}:saturation=${recipe.saturation}`
    );
  }

  // Add text overlays
  const textOverlays = recipe.textOverlays || [];
  textOverlays.forEach((overlay) => {
    filters.push(buildTextFilter(overlay, targetW, targetH));
  });

  return filters.join(",");
}

export function buildAudioFilter(speed: number, normalizeAudio: boolean): string {
  if (speed <= 0) return "";
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

  if (normalizeAudio) filters.push("loudnorm=I=-14:TP=-1.5:LRA=11");

  return filters.join(",");
}

function buildAudioTrimFilter(recipe: EditRecipe): string {
  if (recipe.trimStart === 0 && recipe.trimEnd === null) return "";
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

function buildArguments(
  recipe: EditRecipe,
  format: "mp4" | "webm" | "mkv" | "gif",
  outputName: string,
  inputName: string,
  targetW: number,
  targetH: number,
  hasMusicTrack: boolean,
  musicInputName: string,
  musicOptions: BackgroundMusicOptions | undefined,
  hasOverlay: boolean,
  overlayInputName: string,
  overlayOptions: ImageOverlayOptions | undefined,
  hasOriginalAudio: boolean,
  videoDuration: number
): string[] {
  const vf = buildVideoFilter(recipe, targetW, targetH);
  const audioTrim = hasOriginalAudio ? buildAudioTrimFilter(recipe) : "";
  const audioSpeed = hasOriginalAudio ? buildAudioFilter(recipe.speed, recipe.normalizeAudio ?? false) : "";
  const afParts = [audioTrim, audioSpeed].filter(Boolean);
  const af = afParts.join(",");

  const musicIdx = 1;
  const overlayIdx = hasMusicTrack ? 2 : 1;

  const args: string[] = [];
  args.push("-i", inputName);
  if (hasMusicTrack) {
    if (musicOptions!.loopMusic) args.push("-stream_loop", "-1");
    args.push("-i", musicInputName);
  }
  if (hasOverlay) {
    args.push("-i", overlayInputName);
  }

  const needsFilterComplex = hasOverlay || hasMusicTrack;
  const shouldKeepAudio = recipe.keepAudio && (hasOriginalAudio || hasMusicTrack);

  if (needsFilterComplex) {
    const filterParts: string[] = [];
    let videoOut = "[0:v]";

    if (vf) {
      filterParts.push(`[0:v]${vf}[vbase]`);
      videoOut = "[vbase]";
    }

    if (hasOverlay) {
      const scaledW = overlayOptions!.size;
      const alpha = (overlayOptions!.opacity / 100).toFixed(2);
      const posMap: Record<string, string> = {
        "top-left":     "20:20",
        "top-right":    "W-w-20:20",
        "bottom-left":  "20:H-h-20",
        "bottom-right": "W-w-20:H-h-20",
      };
      const pos = posMap[overlayOptions!.position] ?? "W-w-20:H-h-20";
      filterParts.push(`[${overlayIdx}:v]scale=${scaledW}:-2,format=rgba,colorchannelmixer=aa=${alpha}[logo]`);
      filterParts.push(`${videoOut}[logo]overlay=${pos}[vout]`);
      videoOut = "[vout]";
    }

    let audioOut = "";
    if (shouldKeepAudio) {
      if (hasMusicTrack) {
        const musicVol = (musicOptions!.musicVolume / 100).toFixed(2);
        if (hasOriginalAudio) {
          const origVol  = (musicOptions!.originalAudioVolume / 100).toFixed(2);
          const origChain = afParts.length > 0
            ? `[0:a]${afParts.join(",")},volume=${origVol}[orig]`
            : `[0:a]volume=${origVol}[orig]`;
          filterParts.push(origChain);
          filterParts.push(`[${musicIdx}:a]volume=${musicVol}[music]`);
          filterParts.push(`[orig][music]amix=inputs=2:duration=first:dropout_transition=0[aout]`);
          audioOut = "[aout]";
        } else {
          filterParts.push(`[${musicIdx}:a]volume=${musicVol}[aout]`);
          audioOut = "[aout]";
        }
      } else if (hasOriginalAudio && af) {
        filterParts.push(`[0:a]${af}[aout]`);
        audioOut = "[aout]";
      }
    }

    if (filterParts.length > 0) {
      args.push("-filter_complex", filterParts.join(";"));
    }
    args.push("-map", videoOut === "[0:v]" ? "0:v" : videoOut);

    if (!shouldKeepAudio) {
      args.push("-an");
    } else if (audioOut) {
      args.push("-map", audioOut);
    } else if (hasOriginalAudio) {
      args.push("-map", "0:a");
    }
  } else {
    if (vf) args.push("-vf", vf);
    if (!shouldKeepAudio) {
      args.push("-an");
    } else if (af && hasOriginalAudio) {
      args.push("-af", af);
    }
  }

  if (format === "webm") {
    args.push(
      "-c:v", "libvpx-vp9",
      "-b:v", "0",
      "-crf", String(recipe.quality),
      "-cpu-used", "4",
      "-deadline", "realtime"
    );
    if (shouldKeepAudio) args.push("-c:a", "libopus");
  } else if (format === "mkv") {
    args.push("-c:v", "libx264", "-crf", String(recipe.quality), "-preset", "ultrafast");
    if (shouldKeepAudio) args.push("-c:a", "aac", "-b:a", "128k");
  } else {
    args.push("-c:v", "libx264", "-crf", String(recipe.quality), "-preset", "ultrafast", "-movflags", "+faststart");
    if (shouldKeepAudio) args.push("-c:a", "aac", "-b:a", "128k");
  }

  // Add explicit output duration when speed != 1 to prevent slight duration
  // overshoot caused by encoder/filter pipeline frame flush at stream end.
  if (recipe.speed !== 1) {
    const sourceDuration = (recipe.trimEnd ?? videoDuration) - recipe.trimStart;
    const outputDuration = sourceDuration / recipe.speed;
    args.push("-t", outputDuration.toFixed(6));
  }

  args.push(outputName);
  return args;
}

export async function exportVideo(
  ffmpeg: FFmpeg,
  file: File,
  recipe: EditRecipe,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
  musicOptions?: BackgroundMusicOptions,
  overlayOptions?: ImageOverlayOptions
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

  const getOutputConfig = (format: string) => {
    switch (format) {
      case "webm":
        return { filename: `output_${sessionId}.webm`, mimeType: "video/webm" };
      case "mkv":
        return { filename: `output_${sessionId}.mkv`, mimeType: "video/x-matroska" };
      case "gif":
        return { filename: `output_${sessionId}.gif`, mimeType: "image/gif" };
      default:
        return { filename: `output_${sessionId}.mp4`, mimeType: "video/mp4" };
    }
  };

  const { filename: outputName, mimeType } = getOutputConfig(recipe.format);
  const fallbackOutputName = `fallback_${sessionId}.webm`;
  const paletteName = `palette_${sessionId}.png`;
  const cleanupFiles = new Set<string>([inputName, outputName, fallbackOutputName, paletteName]);

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  };

  // Read actual video duration via HTMLVideoElement so we can correctly
  // compute output duration when trimEnd is null (no trim set by user).
  // Falls back to trimEnd if metadata loading fails.
  const videoDuration = await new Promise<number>((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      // Safe fallback: use trimEnd if available, otherwise 0 which
      // will produce no -t argument and leave duration uncapped.
      resolve(recipe.trimEnd ?? 0);
    };
    video.src = URL.createObjectURL(file);
  });

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file), { signal });

    const hasMusicTrack = !!(musicOptions?.file && recipe.keepAudio);
    const musicInputName = `music_input_${sessionId}.mp3`;
    if (hasMusicTrack) {
      await ffmpeg.writeFile(musicInputName, await fetchFile(musicOptions!.file!), { signal });
      cleanupFiles.add(musicInputName);
    }

    const hasOverlay = !!overlayOptions?.file;
    const overlayExt = overlayOptions?.file?.name.split(".").pop() ?? "png";
    const overlayInputName = `overlay_${sessionId}.${overlayExt}`;
    if (hasOverlay) {
      await ffmpeg.writeFile(overlayInputName, await fetchFile(overlayOptions!.file!), { signal });
      cleanupFiles.add(overlayInputName);
    }

    ffmpeg.on("progress", handleProgress);

    // ── Two-pass GIF export ──────────────────────────────────────────────────
    if (recipe.format === "gif") {
      const vf = buildVideoFilter(recipe, targetW, targetH);
      const vfWithPalette = vf ? `${vf},palettegen` : "palettegen";
      const vfWithPaletteUse = vf
        ? `[0:v]${vf}[x];[x][1:v]paletteuse`
        : "[0:v][1:v]paletteuse";

      // Add explicit output duration when speed != 1 to prevent slight duration
      // overshoot caused by encoder/filter pipeline frame flush at stream end.
      // Applied to both passes so palette and render are bounded identically.
      const gifDurationArgs: string[] =
        recipe.speed !== 1
          ? (() => {
              const sourceDuration =
                (recipe.trimEnd ?? videoDuration) - recipe.trimStart;
              const outputDuration = sourceDuration / recipe.speed;
              return ["-t", outputDuration.toFixed(6)];
            })()
          : [];

      // Pass 1: generate colour palette
      const pass1Code = await ffmpeg.exec(
        ["-i", inputName, "-vf", vfWithPalette, ...gifDurationArgs, "-y", paletteName],
        undefined,
        { signal }
      );
      if (pass1Code !== 0) throw new Error("GIF palette generation failed");

      // Pass 2: render GIF using the palette
      const pass2Code = await ffmpeg.exec(
        ["-i", inputName, "-i", paletteName, "-lavfi", vfWithPaletteUse, ...gifDurationArgs, "-y", outputName],
        undefined,
        { signal }
      );
      if (pass2Code !== 0) throw new Error("GIF export failed");

      const data = await ffmpeg.readFile(outputName, undefined, { signal });
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "image/gif" });

      ffmpeg.off("progress", handleProgress);
      onProgress(100);
      return {
        blobUrl: URL.createObjectURL(blob),
        blob,
        size: blob.size,
        width: targetW,
        height: targetH,
        format: "gif" as const,
      };
    }
    // ────────────────────────────────────────────────────────────────────────

    let missingAudioDetected = false;
    const logListener = ({ message }: { message: string }) => {
      const msg = message.toLowerCase();
      if (
        msg.includes("matches no streams") ||
        msg.includes("specifier '0:a'") ||
        msg.includes("input pad 0 on filter src")
      ) {
        missingAudioDetected = true;
      }
    };
    ffmpeg.on("log", logListener);

    // Attempt 1: Process with standard audio streams
    let args = buildArguments(
      recipe, recipe.format, outputName, inputName, targetW, targetH,
      hasMusicTrack, musicInputName, musicOptions,
      hasOverlay, overlayInputName, overlayOptions, true, videoDuration
    );

    let exitCode = await ffmpeg.exec(args, undefined, { signal });

    // Attempt 2: Auto-recover if the file has no original audio track
    if (exitCode !== 0 && missingAudioDetected) {
      missingAudioDetected = false;
      args = buildArguments(
        recipe, recipe.format, outputName, inputName, targetW, targetH,
        hasMusicTrack, musicInputName, musicOptions,
        hasOverlay, overlayInputName, overlayOptions, false, videoDuration
      );
      exitCode = await ffmpeg.exec(args, undefined, { signal });
    }

    // Fallback Attempt 3: Switch codecs to WebM if container errors happen
    if (exitCode !== 0) {
      args = buildArguments(
        recipe, "webm", fallbackOutputName, inputName, targetW, targetH,
        hasMusicTrack, musicInputName, musicOptions,
        hasOverlay, overlayInputName, overlayOptions, !missingAudioDetected, videoDuration
      );

      const fallbackCode = await ffmpeg.exec(args, undefined, { signal });
      if (fallbackCode !== 0) throw new Error("Export failed");

      const data = await ffmpeg.readFile(fallbackOutputName, undefined, { signal });
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/webm" });

      ffmpeg.off("log", logListener);
      onProgress(100);
      return {
        blobUrl: URL.createObjectURL(blob),
        blob,
        size: blob.size,
        width: targetW,
        height: targetH,
        format: "webm",
      };
    }

    const data = await ffmpeg.readFile(outputName, undefined, { signal });
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: mimeType });

    ffmpeg.off("log", logListener);
    onProgress(100);
    return {
      blobUrl: URL.createObjectURL(blob),
      blob,
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
