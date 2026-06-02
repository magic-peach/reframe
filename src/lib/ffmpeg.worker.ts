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
  if (recipe.stabilization) filters.push("deshake");
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
  if (recipe.denoise) filters.push("hqdn3d=1.5:1.5:6:6");
  const needsEq = recipe.brightness !== 0 || recipe.contrast !== 1 || recipe.saturation !== 1;
  if (needsEq) {
    filters.push(`eq=brightness=${recipe.brightness}:contrast=${recipe.contrast}:saturation=${recipe.saturation}`);
  }
  const textOverlays = recipe.textOverlays || [];
  textOverlays.forEach((overlay) => {
    filters.push(buildTextFilter(overlay, targetW, targetH));
  });
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
  const args: string[] = [];
  args.push("-i", inputName);
  if (hasMusicTrack) {
    if (musicOptions!.loopMusic) args.push("-stream_loop", "-1");
    args.push("-i", musicInputName);
  }
  if (hasOverlay) args.push("-i", overlayInputName);

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
      interface PositionCoords { x: number; y: number; }
      const pos = typeof overlayOptions?.position === "string"
        ? (posMap[overlayOptions.position] ?? "W-w-20:H-h-20")
        : overlayOptions?.position
        ? `(W-w)*${(overlayOptions.position as PositionCoords).x}/100:(H-h)*${(overlayOptions.position as PositionCoords).y}/100`
        : "W-w-20:H-h-20";
      filterParts.push(`[${hasMusicTrack ? 2 : 1}:v]scale=${scaledW}:-2,format=rgba,colorchannelmixer=aa=${alpha}[logo]`);
      filterParts.push(`${videoOut}[logo]overlay=${pos}[vout]`);
      videoOut = "[vout]";
    }
    let audioOut = "";
    if (shouldKeepAudio) {
      if (hasMusicTrack) {
        const musicVol = (musicOptions!.musicVolume / 100).toFixed(2);
        if (hasOriginalAudio) {
          const origVol = (musicOptions!.originalAudioVolume / 100).toFixed(2);
          const audioTrim = buildAudioTrimFilter(recipe);
          const audioSpeed = buildAudioFilter(recipe.speed, recipe.normalizeAudio ?? false);
          const afParts = [audioTrim, audioSpeed].filter(Boolean);
          const origChain = afParts.length > 0 ? `[0:a]${afParts.join(",")},volume=${origVol}[orig]` : `[0:a]volume=${origVol}[orig]`;
          filterParts.push(origChain);
          filterParts.push(`[1:a]volume=${musicVol}[music]`);
          filterParts.push(`[orig][music]amix=inputs=2:duration=first:dropout_transition=0[aout]`);
          audioOut = "[aout]";
        } else {
          filterParts.push(`[1:a]volume=${musicVol}[aout]`);
          audioOut = "[aout]";
        }
      }
    }
    args.push("-filter_complex", filterParts.join(";"));
    args.push("-map", videoOut);
    if (audioOut && shouldKeepAudio) args.push("-map", audioOut);
  } else {
    if (vf) args.push("-vf", vf);
    if (shouldKeepAudio && hasOriginalAudio) {
      const audioTrim = buildAudioTrimFilter(recipe);
      const audioSpeed = buildAudioFilter(recipe.speed, recipe.normalizeAudio ?? false);
      const afParts = [audioTrim, audioSpeed].filter(Boolean);
      if (afParts.length > 0) args.push("-af", afParts.join(","));
    } else if (!shouldKeepAudio) {
      args.push("-an");
    }
  }

  const duration = recipe.trimEnd !== null ? recipe.trimEnd - recipe.trimStart : videoDuration;
  const targetDuration = duration / recipe.speed;
  args.push("-t", targetDuration.toFixed(4));

  if (format === "mp4") {
    args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-pix_fmt", "yuv420p");
  } else if (format === "webm") {
    args.push("-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus");
  } else if (format === "gif") {
    args.push("-vf", (vf ? vf + "," : "") + "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse");
  }
  args.push(outputName);
  return args;
}

async function loadFFmpeg() {
  if (ffmpegLoaded && ffmpeg) return;
  ffmpeg = new FFmpeg();
  const coreJsUrl = await fetchWithIntegrity(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript");
  const coreWasmUrl = await fetchWithIntegrity(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm");
  await ffmpeg.load({ coreURL: coreJsUrl, wasmURL: coreWasmUrl });
  ffmpegLoaded = true;
}

async function handleExport(data: ExportRequest) {
  if (!ffmpeg || !ffmpegLoaded) {
    self.postMessage({ type: "error", id: data.id, message: "FFmpeg not initialized" } as WorkerResponse);
    return;
  }

  activeExportId = data.id;
  activeExportAbortController = new AbortController();
  const createdVirtualFiles: string[] = [];

  try {
    const preset = getPresetById(data.recipe.presetId);
    const targetW = preset?.width ?? 1080;
    const targetH = preset?.height ?? 1920;
    const format = data.recipe.format ?? "mp4";
    
    const inputName = `input_${data.id}_${data.file.name}`;
    const outputName = `output_${data.id}.${format}`;

    await ffmpeg.writeFile(inputName, new Uint8Array(data.file.data));
    createdVirtualFiles.push(inputName);

    let musicInputName = "";
    const hasMusicTrack = !!data.musicFile;
    if (hasMusicTrack && data.musicFile) {
      musicInputName = `music_${data.id}_${data.musicFile.name}`;
      await ffmpeg.writeFile(musicInputName, new Uint8Array(data.musicFile.data));
      createdVirtualFiles.push(musicInputName);
    }

    let overlayInputName = "";
    const hasOverlay = !!data.overlayFile;
    if (hasOverlay && data.overlayFile) {
      overlayInputName = `overlay_${data.id}_${data.overlayFile.name}`;
      await ffmpeg.writeFile(overlayInputName, new Uint8Array(data.overlayFile.data));
      createdVirtualFiles.push(overlayInputName);
    }

    let hasOriginalAudio = false;
    try {
      hasOriginalAudio = true; 
    } catch {
      hasOriginalAudio = false;
    }

    const ffmpegArgs = buildArguments(
      data.recipe, format, outputName, inputName, targetW, targetH,
      hasMusicTrack, musicInputName, data.musicOptions,
      hasOverlay, overlayInputName, data.overlayOptions,
      hasOriginalAudio, data.videoDuration
    );

    ffmpeg.on("progress", ({ progress }) => {
      self.postMessage({ type: "progress", percent: Math.round(progress * 100) } as WorkerResponse);
    });

    createdVirtualFiles.push(outputName);
    await ffmpeg.exec(ffmpegArgs);

    const outputData = await ffmpeg.readFile(outputName);
    const buffer = (outputData as Uint8Array).buffer;
    const mimeMap = { mp4: "video/mp4", webm: "video/webm", mkv: "video/x-matroska", gif: "image/gif" };

    self.postMessage({
      type: "result",
      id: data.id,
      data: buffer,
      mimeType: mimeMap[format],
      size: outputData.length,
      width: targetW,
      height: targetH,
      format,
    } as WorkerResponse, [buffer]);

  } catch (error: any) {
    if (activeExportAbortController?.signal.aborted) {
      self.postMessage({ type: "cancelled", id: data.id } as WorkerResponse);
    } else {
      self.postMessage({ type: "error", id: data.id, message: error.message || "Export processing pipeline failure" } as WorkerResponse);
    }
  } finally {
    for (const fileName of createdVirtualFiles) {
      try {
        if (ffmpeg && typeof ffmpeg.deleteFile === "function") {
          await ffmpeg.deleteFile(fileName);
        }
      } catch (cleanupError) {
        console.warn(`Failed clearing internal file context asset: ${fileName}`, cleanupError);
      }
    }
    activeExportId = null;
    activeExportAbortController = null;
  }
}

self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const data = event.data;
  if (data.type === "load") {
    try {
      await loadFFmpeg();
      self.postMessage({ type: "ready" } as WorkerResponse);
    } catch (err: any) {
      self.postMessage({ type: "error", message: err.message || "Failed initializing module dependency" } as WorkerResponse);
    }
  } else if (data.type === "export") {
    await handleExport(data);
  } else if (data.type === "cancel") {
    if (activeExportAbortController) {
      activeExportAbortController.abort();
    }
  }
};
