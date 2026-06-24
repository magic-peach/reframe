import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { EditRecipe, BackgroundMusicOptions, ImageOverlayOptions } from "./types";
import { getPresetById } from "./presets";
import { buildTextFilter } from "./text-overlay";

const CORE_BASE_URL = "https://jsdelivr.net";
const MT_CORE_BASE_URL = "https://jsdelivr.net";
const SRI_HASHES: Record<string, string> = {
  "ffmpeg-core.js":   "sha384-sKfkiFtvUk+vexk+0EUhEh366190/4WpgUAsUvaxEfyg7+E1Zt5Y5hrsU808g8Q9",
  "ffmpeg-core.wasm": "sha384-U1VDhkPYrM3wTCT4/vjSpSsKqG/UjljYrYCI4hBSJ02svbCkxuCi6U6u/peg5vpW",
};

type SerializedFile = {
  name: string;
  type: string;
  data: ArrayBuffer;
};

type ExportRequest = {
  type: "export";
  id: string;
  file: SerializedFile;
  recipe: EditRecipe;
  videoDuration: number;
  musicFile?: SerializedFile;
  musicOptions?: BackgroundMusicOptions;
  overlayFile?: SerializedFile;
  overlayOptions?: ImageOverlayOptions;
};

type LoadRequest = { type: "load" };

type CancelRequest = { type: "cancel" };

type TerminateRequest = { type: "terminate" };

type WorkerCommand = LoadRequest | ExportRequest | CancelRequest | TerminateRequest;

type ProgressPayload = { type: "progress"; percent: number };

type ReadyPayload = { type: "ready" };

type ResultPayload = {
  type: "result";
  id: string;
  data: ArrayBuffer;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  format: "mp4" | "webm" | "mkv" | "gif";
};

type ErrorPayload = { type: "error"; id?: string; message: string };

type CancelledPayload = { type: "cancelled"; id?: string };

type WorkerResponse = ProgressPayload | ReadyPayload | ResultPayload | ErrorPayload | CancelledPayload;

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;
let activeExportAbortController: AbortController | null = null;
let activeExportId: string | null = null;

async function fetchWithIntegrity(url: string, mimeType: string): Promise<string> {
  const key = url.split("/").pop()!;
  const integrity = SRI_HASHES[key];

  if (!integrity) {
    const response = await fetch(url, { credentials: "omit" });
    const blob = new Blob([await response.arrayBuffer()], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  const response = await fetch(url, { integrity, credentials: "omit" });
  const blob = new Blob([await response.arrayBuffer()], { type: mimeType });
  return URL.createObjectURL(blob);
}

function buildVideoFilter(recipe: EditRecipe, targetW: number, targetH: number): string {
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

  // --- TRANSITIONS INJECTION ---
  const fadeInDuration = (recipe as any).fadeInDuration || 0;
  const fadeOutDuration = (recipe as any).fadeOutDuration || 0;
  const speed = recipe.speed || 1;
  const baseDuration = (recipe.trimEnd !== null ? recipe.trimEnd : 10) - recipe.trimStart;
  const calculatedDuration = baseDuration > 0 ? (baseDuration / speed) : 10;

  if (fadeInDuration > 0) {
    const safeInDur = Math.min(fadeInDuration, calculatedDuration);
    filters.push(`fade=t=in:st=0:d=${safeInDur}`);
  }

  if (fadeOutDuration > 0) {
    const safeOutDur = Math.min(fadeOutDuration, calculatedDuration);
    const outStart = Math.max(0, calculatedDuration - safeOutDur);
    filters.push(`fade=t=out:st=${outStart}:d=${safeOutDur}`);
  }

  return filters.join(",");
}

function buildAudioFilter(speed: number, normalizeAudio: boolean): string {
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

      interface PositionCoords {
        x: number;
        y: number;
      }

      const pos = typeof overlayOptions?.position === "string"
        ? (posMap[overlayOptions.position] ?? "W-w-20:H-h-20")
        : overlayOptions?.position
        ? `(W-w)*${(overlayOptions.position as PositionCoords).x}/100:(H-h)*${(overlayOptions.position as PositionCoords).y}/100`
        : "W-w-20:H-h-20";

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
      }
    }

    if (filterParts.length > 0) {
      args.push("-filter_complex", filterParts.join(";"));
      if (vf || hasOverlay) args.push("-map", videoOut);
      if (shouldKeepAudio && audioOut) args.push("-map", audioOut);
    }
  } else {
    if (vf) args.push("-vf", vf);
    if (shouldKeepAudio && af) args.push("-af", af);
  }

  if (format === "gif") {
    args.push("-f", "gif");
  } else if (format === "webm") {
    args.push("-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus");
  } else if (format === "mkv") {
    args.push("-c:v", "copy", "-c:a", "copy");
  } else {
    args.push("-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p");
    if (shouldKeepAudio) args.push("-c:a", "aac", "-b:a", "128k");
  }

  args.push(outputName);
  return args;
}

self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  // Logic parsing worker tasks continues here...
};
