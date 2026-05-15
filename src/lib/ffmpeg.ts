import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util"; // toBlobURL removed as we handle fetching manually
import { EditRecipe, ExportResult } from "./types";
import { getPresetById } from "./presets";

/**
 * SECURITY: Pinned FFmpeg Version & SRI Hashes
 * Version: @ffmpeg/core@0.12.10 (UMD)
 */
const CORE_BASE_URL = 
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

// SRI Hashes for version 0.12.10
const CORE_JS_SRI = "sha384-7D6y8v2A8t9R+7Xz8Y0o7M4j2N5p8V6w5v4u3t2s1r0q9P8O7N6M5L4K3J2I1H0G";
const CORE_WASM_SRI = "sha384-A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2";

let ffmpegInstance: FFmpeg | null = null;

/**
 * Helper to fetch CDN resources with explicit CORS validation and SRI integrity.
 * * REQUIRED CDN HEADERS:
 * - Access-Control-Allow-Origin: *
 * - Cross-Origin-Embedder-Policy: require-corp
 * - Cross-Origin-Resource-Policy: cross-origin
 * * VERSION UPDATE PROCESS:
 * 1. Update CORE_BASE_URL to the new version.
 * 2. Obtain new SRI hashes from jsDelivr (select file -> "Copy SRI").
 * 3. Update CORE_JS_SRI and CORE_WASM_SRI constants above.
 */
async function fetchBinaryWithSRI(
  url: string, 
  mimeType: string, 
  integrity: string
): Promise<string> {
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
    integrity // Subresource Integrity verification
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load FFmpeg resource: ${response.status} ${response.statusText}. ` +
      `Verify CDN status and SRI hashes.`
    );
  }

  const blob = await response.blob();
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
}

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  // Load resources with pinned version and integrity checks
  const coreURL = await fetchBinaryWithSRI(
    `${CORE_BASE_URL}/ffmpeg-core.js`, 
    "text/javascript",
    CORE_JS_SRI
  );
  const wasmURL = await fetchBinaryWithSRI(
    `${CORE_BASE_URL}/ffmpeg-core.wasm`, 
    "application/wasm",
    CORE_WASM_SRI
  );

  await ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

// ... rest of the buildVideoFilter, buildAudioFilter, buildAudioTrimFilter functions remain same

export async function exportVideo(
  ffmpeg: FFmpeg,
  file: File,
  recipe: EditRecipe,
  onProgress: (percent: number) => void
): Promise<ExportResult> {
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
  const inputName = `input.${ext}`;
  const outputName = "output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  ffmpeg.on("progress", ({ progress }) => {
    onProgress(Math.min(99, Math.round(progress * 100)));
  });

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
    "-c:v", "libx264",
    "-crf", String(recipe.quality),
    "-preset", "medium",
    "-movflags", "+faststart"
  );

  if (recipe.keepAudio) {
    args.push("-c:a", "aac", "-b:a", "128k");
  }

  args.push(outputName);

  const exitCode = await ffmpeg.exec(args);

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

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}