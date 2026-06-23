import { EditRecipe, BackgroundMusicOptions, ImageOverlayOptions } from "./types";
import { getPresetById } from "./presets";
import { buildTextFilter } from "./text-overlay";

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

export function buildArguments(
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
    "top-right":    "main_w-w-20:20",
    "bottom-left":  "20:main_h-h-20",
    "bottom-right": "main_w-w-20:main_h-h-20",
  };

interface PositionCoords {
    x: number;
    y: number;
  }

  const pos = typeof overlayOptions?.position === "string"
    ? (posMap[overlayOptions.position] ?? "main_w-w-20:main_h-h-20")
    : overlayOptions?.position
    ? `(main_w-w)*${(overlayOptions.position as PositionCoords).x}/100:(main_h-h)*${(overlayOptions.position as PositionCoords).y}/100`
    : "main_w-w-20:main_h-h-20";

  filterParts.push(`[${overlayIdx}:v]scale=${scaledW}:-2,format=rgba,colorchannelmixer=aa=${alpha}[logo]`);
  filterParts.push(`${videoOut}[logo]overlay=${pos}[vout]`);
  videoOut = "[vout]";
}

    let audioOut = "";
    if (shouldKeepAudio) {
      if (hasMusicTrack) {
        const musicVol = (musicOptions!.musicVolume / 100).toFixed(2);
        if (hasOriginalAudio) {
          const origVol = (musicOptions!.originalAudioVolume / 100).toFixed(2);
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

  if (recipe.speed !== 1) {
    const sourceDuration = (recipe.trimEnd ?? videoDuration) - recipe.trimStart;
    const outputDuration = sourceDuration / recipe.speed;
    args.push("-t", outputDuration.toFixed(6));
  }

  args.push(outputName);
  return args;
}
