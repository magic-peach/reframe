import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { EditRecipe, ExportResult, SPEED_STEPS } from "./types";
import { getPresetById } from "./presets";

// We use the single-threaded core (no -mt suffix) so we don't need
// SharedArrayBuffer or cross-origin isolation headers. Deploys anywhere.
const CORE_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

let ffmpegInstance: FFmpeg | null = null;

// Lazily loads and caches the FFmpeg instance. Safe to call multiple times.
export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  // Load the WASM core from CDN using blob URLs to bypass CORS restrictions
  await ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

// Builds the -vf (video filter) string from the recipe
function buildVideoFilter(recipe: EditRecipe, targetW: number, targetH: number): string {
  const filters: string[] = [];

  // trim first so scale/crop operates on the already-cut footage
  if (recipe.trimStart > 0 || recipe.trimEnd !== null) {
    // use a very large number as "end of file" when the user doesn't set an end time
    const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
    filters.push(`trim=start=${recipe.trimStart}:end=${end}`);
    filters.push("setpts=PTS-STARTPTS"); // reset timestamps after trim
  }

  // Rotation using transpose filter (ffmpeg standard approach)
  if (recipe.rotate === 90) {
    filters.push("transpose=1");
  } else if (recipe.rotate === 180) {
    filters.push("transpose=1,transpose=1");
  } else if (recipe.rotate === 270) {
    filters.push("transpose=2");
  }

  // Framing: fit (letterbox/pillarbox with black bars) vs fill (crop to fill)
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

  // Speed: setpts changes the playback speed of video frames
  if (recipe.speed !== 1) {
    const pts = (1 / recipe.speed).toFixed(4);
    filters.push(`setpts=${pts}*PTS`);
  }

  return filters.join(",");
}

// atempo filter only accepts values between 0.5 and 2.0 — chain it for extremes
function buildAudioFilter(speed: number): string {
  if (speed === 1) return "";

  // 0.25x = 0.5 * 0.5, 4x = 2.0 * 2.0
  if (speed === 0.25) return "atempo=0.5,atempo=0.5";
  if (speed === 4) return "atempo=2.0,atempo=2.0";

  // For values between 0.5 and 2.0 a single atempo works
  return `atempo=${speed}`;
}

// Builds the audio trim filter if trimming is active
function buildAudioTrimFilter(recipe: EditRecipe): string {
  if (recipe.trimStart === 0 && recipe.trimEnd === null) return "";
  const end = recipe.trimEnd !== null ? recipe.trimEnd : 999999;
  return `atrim=start=${recipe.trimStart}:end=${end},asetpts=PTS-STARTPTS`;
}

export async function exportVideo(
  ffmpeg: FFmpeg,
  file: File,
  recipe: EditRecipe,
  onProgress: (percent: number) => void
): Promise<ExportResult> {
  // Figure out the target resolution from preset or custom dimensions
  let targetW: number, targetH: number;
  if (recipe.preset === "custom") {
    targetW = recipe.customWidth;
    targetH = recipe.customHeight;
  } else {
    const preset = getPresetById(recipe.preset);
    targetW = preset?.width ?? 1920;
    targetH = preset?.height ?? 1080;
  }

  // Ensure dimensions are even numbers (required by libx264)
  targetW = Math.round(targetW / 2) * 2;
  targetH = Math.round(targetH / 2) * 2;

  const ext = file.name.split(".").pop() ?? "mp4";
  const inputName = `input.${ext}`;
  const outputName = "output.mp4";

  // Write the user's file into ffmpeg's virtual filesystem
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  ffmpeg.on("progress", ({ progress }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  });

  const vf = buildVideoFilter(recipe, targetW, targetH);
  const audioTrim = buildAudioTrimFilter(recipe);
  const audioSpeed = buildAudioFilter(recipe.speed);

  // Build the audio filter chain by combining trim and speed filters
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
    "-c:v", "libx264",
    "-crf", String(recipe.quality),
    "-preset", "medium",
    "-movflags", "+faststart" // enables streaming/preview before full download
  );

  if (recipe.keepAudio) {
    args.push("-c:a", "aac", "-b:a", "128k");
  }

  args.push(outputName);

  const exitCode = await ffmpeg.exec(args);

  // libx264 might not be available in all wasm builds — fall back to webm
  if (exitCode !== 0) {
    const webmOutput = "output.webm";
    const fallbackArgs = [
      "-i", inputName,
      ...(vf ? ["-vf", vf] : []),
      ...(recipe.keepAudio ? (af ? ["-af", af] : []) : ["-an"]),
      "-c:v", "libvpx-vp9",
      "-crf", String(recipe.quality),
      ...(recipe.keepAudio ? ["-c:a", "libopus"] : []),
      webmOutput,
    ];

    const fallbackCode = await ffmpeg.exec(fallbackArgs);
    if (fallbackCode !== 0) throw new Error("Export failed");

    const data = await ffmpeg.readFile(webmOutput);
    // copy into a plain Uint8Array — ffmpeg returns Uint8Array<ArrayBufferLike>
    // but Blob only accepts ArrayBuffer, so we need to copy it
    const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/webm" });
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(webmOutput);

    onProgress(100);
    return {
      blobUrl: URL.createObjectURL(blob),
      size: blob.size,
      width: targetW,
      height: targetH,
      format: "webm",
    };
  }

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  onProgress(100);
  return {
    blobUrl: URL.createObjectURL(blob),
    size: blob.size,
    width: targetW,
    height: targetH,
    format: "mp4",
  };
}

// Formats bytes to a human-readable string
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
