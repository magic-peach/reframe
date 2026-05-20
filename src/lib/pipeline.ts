import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import JSZip from "jszip";

// --- Schema & Types ---

export interface PipelineStep {
  step: string;
  [key: string]: any;
}

export interface PipelineConfig {
  name?: string;
  pipeline: PipelineStep[];
}

export interface PipelineResult {
  blobUrl: string;
  filename: string;
  isZip: boolean;
  filesCount?: number;
}

// --- Custom YAML & JSON Parser ---

/**
 * A lightweight, zero-dependency YAML and JSON parser.
 * Perfectly parses pipeline configurations and is compatible with static builds.
 */
export function parsePipelineConfig(text: string): PipelineConfig {
  const trimmedText = text.trim();
  if (trimmedText.startsWith("{")) {
    try {
      return JSON.parse(trimmedText) as PipelineConfig;
    } catch (e) {
      throw new Error(`Invalid JSON format: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  try {
    const lines = text.split("\n");
    const result: PipelineConfig = { pipeline: [] };
    let currentStep: PipelineStep | null = null;

    for (let line of lines) {
      // Strip comments
      const commentIdx = line.indexOf("#");
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      line = line.trimEnd();
      if (!line.trim()) continue;

      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      if (trimmed.startsWith("-")) {
        if (currentStep) {
          result.pipeline.push(currentStep);
        }
        currentStep = { step: "" };
        const rest = trimmed.substring(1).trim();
        if (rest) {
          const colonIdx = rest.indexOf(":");
          if (colonIdx !== -1) {
            const k = rest.substring(0, colonIdx).trim();
            const v = parseYamlValue(rest.substring(colonIdx + 1).trim());
            if (k === "step") {
              currentStep.step = String(v);
            } else {
              currentStep[k] = v;
            }
          } else {
            currentStep.step = rest;
          }
        }
      } else {
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx !== -1) {
          const k = trimmed.substring(0, colonIdx).trim();
          const v = parseYamlValue(trimmed.substring(colonIdx + 1).trim());
          if (currentStep && indent > 0) {
            if (k === "step") {
              currentStep.step = String(v);
            } else {
              currentStep[k] = v;
            }
          } else {
            if (k === "name") {
              result.name = String(v);
            }
          }
        }
      }
    }

    if (currentStep) {
      result.pipeline.push(currentStep);
    }

    if (!result.pipeline || result.pipeline.length === 0) {
      throw new Error("No pipeline steps found under 'pipeline:' key");
    }

    return result;
  } catch (e) {
    throw new Error(`YAML Parse Error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function parseYamlValue(v: string): any {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (!isNaN(v as any) && v !== "") return Number(v);
  return v;
}

// --- Background Color Keying Helper ---

function parseColorToRGB(colorStr: string): { r: number; g: number; b: number } {
  const c = colorStr.toLowerCase().trim();
  if (c === "green") return { r: 0, g: 255, b: 0 };
  if (c === "blue") return { r: 0, g: 0, b: 255 };
  if (c === "red") return { r: 255, g: 0, b: 0 };
  if (c === "black") return { r: 0, g: 0, b: 0 };
  if (c === "white") return { r: 255, g: 255, b: 255 };

  // Parse Hex #RRGGBB or RRGGBB
  const hex = c.startsWith("#") ? c.slice(1) : c;
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return { r, g, b };
    }
  }
  // Default to Green screen removal if unknown
  return { r: 0, g: 255, b: 0 };
}

// --- Canvas Processing for Extracted Frames ---

interface CanvasImageOptions {
  resize?: { width: number; height: number };
  removeBackground?: { color: string; similarity: number; blend: number };
  format: "png" | "jpeg" | "webp";
}

async function processImageOnCanvas(
  imageBlob: Blob,
  options: CanvasImageOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not initialize 2D canvas context"));
        return;
      }

      // 1. Resize/Scale step
      let targetW = img.width;
      let targetH = img.height;
      if (options.resize) {
        targetW = options.resize.width;
        targetH = options.resize.height;
      }
      canvas.width = targetW;
      canvas.height = targetH;

      ctx.drawImage(img, 0, 0, targetW, targetH);

      // 2. Remove background (Chroma key / Color key)
      if (options.removeBackground) {
        const { color, similarity } = options.removeBackground;
        const targetRGB = parseColorToRGB(color);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const pixels = imgData.data;
        const threshold = similarity * 255;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];

          // Euclidean color distance
          const distance = Math.sqrt(
            Math.pow(r - targetRGB.r, 2) +
            Math.pow(g - targetRGB.g, 2) +
            Math.pow(b - targetRGB.b, 2)
          );

          if (distance < threshold) {
            pixels[i + 3] = 0; // Completely transparent
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // 3. Convert format
      let mime = "image/png";
      if (options.format === "jpeg") mime = "image/jpeg";
      if (options.format === "webp") mime = "image/webp";

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas export to Blob failed"));
      }, mime, 0.9);
    };
    img.onerror = () => reject(new Error("Failed to load frame into HTMLImageElement"));
    img.src = URL.createObjectURL(imageBlob);
  });
}

// --- Core Runner ---

export async function runPipeline(
  ffmpeg: FFmpeg,
  file: File,
  configText: string,
  onLog: (msg: string) => void,
  onProgress: (pct: number) => void
): Promise<PipelineResult> {
  const sessionId = Math.random().toString(36).substring(7);
  onLog(`[${new Date().toLocaleTimeString()}] 🚀 Initiating Pipeline execution...`);

  // Step 1: Parse Config
  onProgress(5);
  onLog(`[${new Date().toLocaleTimeString()}] ⚙️ Parsing Pipeline Presets...`);
  const config = parsePipelineConfig(configText);
  onLog(`[${new Date().toLocaleTimeString()}] 📂 Loaded pipeline${config.name ? `: "${config.name}"` : ""} with ${config.pipeline.length} steps.`);

  // Validate pipeline steps
  const validSteps = ["trim", "rotate", "resize", "remove_background", "extract_frames", "convert"];
  for (const step of config.pipeline) {
    if (!validSteps.includes(step.step)) {
      throw new Error(`Validation Error: Unsupported step "${step.step}". Valid steps are: ${validSteps.join(", ")}`);
    }
  }

  // Detect if frame extraction is part of pipeline
  const extractStepIndex = config.pipeline.findIndex((s) => s.step === "extract_frames");
  const hasFrameExtraction = extractStepIndex !== -1;

  const ext = file.name.split(".").pop() ?? "mp4";
  const inputName = `pipe_in_${sessionId}.${ext}`;
  const videoOutputName = `pipe_out_${sessionId}.mp4`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  onLog(`[${new Date().toLocaleTimeString()}] 📝 Wrote source video file to Web VFS.`);

  let progressPct = 10;
  onProgress(progressPct);

  // Setup logging redirect
  const progressHandler = ({ progress }: { progress: number }) => {
    // Only update progress based on active FFmpeg processing if not batch rendering images
    if (!hasFrameExtraction) {
      const mappedPct = 10 + Math.round(progress * 80);
      onProgress(Math.min(95, mappedPct));
    }
  };
  const logHandler = ({ message }: { message: string }) => {
    if (message.trim()) {
      onLog(`[FFmpeg] ${message.trim()}`);
    }
  };
  ffmpeg.on("progress", progressHandler);
  ffmpeg.on("log", logHandler);

  try {
    if (!hasFrameExtraction) {
      // --- Scenario A: Video processing pipeline ---
      onLog(`[${new Date().toLocaleTimeString()}] 🎥 Compiling single-pass video filters...`);
      const vfFilters: string[] = [];
      let format = "mp4";
      let trimStart = 0;
      let trimEnd: number | null = null;
      let hasTrim = false;

      for (const step of config.pipeline) {
        if (step.step === "trim") {
          trimStart = Number(step.start ?? 0);
          trimEnd = step.end !== undefined ? Number(step.end) : null;
          hasTrim = true;
        } else if (step.step === "rotate") {
          const angle = Number(step.angle ?? 90);
          if (angle === 90) vfFilters.push("transpose=1");
          else if (angle === 180) vfFilters.push("transpose=1,transpose=1");
          else if (angle === 270) vfFilters.push("transpose=2");
        } else if (step.step === "resize") {
          const w = Math.round(Number(step.width ?? 512) / 2) * 2;
          const h = Math.round(Number(step.height ?? 512) / 2) * 2;
          const fit = step.fit ?? "contain";
          if (fit === "contain") {
            vfFilters.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black`);
          } else {
            vfFilters.push(`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`);
          }
        } else if (step.step === "remove_background") {
          const col = String(step.color ?? "green");
          const sim = Number(step.similarity ?? 0.15);
          const bld = Number(step.blend ?? 0.05);
          const rgb = parseColorToRGB(col);
          const hexStr = `0x${rgb.r.toString(16).padStart(2, "0")}${rgb.g.toString(16).padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`;
          // Add chromakey transparent filter
          vfFilters.push(`chromakey=color=${hexStr}:similarity=${sim}:blend=${bld}`);
        } else if (step.step === "convert") {
          format = String(step.format ?? "mp4").toLowerCase();
        }
      }

      const args: string[] = ["-i", inputName];
      
      if (hasTrim) {
        args.push("-ss", String(trimStart));
        if (trimEnd !== null) {
          args.push("-to", String(trimEnd));
        }
      }

      if (vfFilters.length > 0) {
        args.push("-vf", vfFilters.join(","));
      }

      // Match codec selection to requested format
      const outExt = format === "webm" ? "webm" : format === "mkv" ? "mkv" : "mp4";
      const actualOutName = `pipe_out_${sessionId}.${outExt}`;

      if (outExt === "webm") {
        args.push("-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-c:a", "libopus", actualOutName);
      } else if (outExt === "mkv") {
        args.push("-c:v", "libx264", "-crf", "23", "-c:a", "aac", actualOutName);
      } else {
        args.push("-c:v", "libx264", "-crf", "23", "-preset", "medium", "-c:a", "aac", "-pix_fmt", "yuv420p", actualOutName);
      }

      onLog(`[${new Date().toLocaleTimeString()}] ⚙️ Running: ffmpeg ${args.join(" ")}`);
      const exitCode = await ffmpeg.exec(args);
      if (exitCode !== 0) {
        throw new Error(`FFmpeg processing failed with exit code ${exitCode}`);
      }

      onProgress(95);
      const data = await ffmpeg.readFile(actualOutName);
      const videoBlob = new Blob([new Uint8Array(data as Uint8Array)], {
        type: outExt === "webm" ? "video/webm" : outExt === "mkv" ? "video/x-matroska" : "video/mp4",
      });

      // Cleanup
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(actualOutName);
      } catch {}

      onProgress(100);
      onLog(`[${new Date().toLocaleTimeString()}] ✅ Video pipeline completed successfully.`);
      return {
        blobUrl: URL.createObjectURL(videoBlob),
        filename: `reframe_pipeline_output.${outExt}`,
        isZip: false,
      };
    } else {
      // --- Scenario B: Frame Extraction & Batch Image Processing ---
      const preSteps = config.pipeline.slice(0, extractStepIndex);
      const extractStep = config.pipeline[extractStepIndex];
      const postSteps = config.pipeline.slice(extractStepIndex + 1);

      onLog(`[${new Date().toLocaleTimeString()}] 🔨 Pre-processing video before frame extraction...`);
      // If there are pre-extraction steps (like trim or rotate), apply them to create an intermediate video
      let currentInputVideo = inputName;
      const preVf: string[] = [];
      let hasTrim = false;
      let trimStart = 0;
      let trimEnd: number | null = null;

      for (const step of preSteps) {
        if (step.step === "trim") {
          trimStart = Number(step.start ?? 0);
          trimEnd = step.end !== undefined ? Number(step.end) : null;
          hasTrim = true;
        } else if (step.step === "rotate") {
          const angle = Number(step.angle ?? 90);
          if (angle === 90) preVf.push("transpose=1");
          else if (angle === 180) preVf.push("transpose=1,transpose=1");
          else if (angle === 270) preVf.push("transpose=2");
        }
      }

      if (hasTrim || preVf.length > 0) {
        const intermediateVideo = `pipe_inter_${sessionId}.mp4`;
        const args: string[] = ["-i", currentInputVideo];
        if (hasTrim) {
          args.push("-ss", String(trimStart));
          if (trimEnd !== null) args.push("-to", String(trimEnd));
        }
        if (preVf.length > 0) {
          args.push("-vf", preVf.join(","));
        }
        args.push("-c:a", "copy", intermediateVideo);
        
        onLog(`[${new Date().toLocaleTimeString()}] ⚙️ Custom trim/rotate prior to extraction: ffmpeg ${args.join(" ")}`);
        const exit = await ffmpeg.exec(args);
        if (exit === 0) {
          currentInputVideo = intermediateVideo;
        } else {
          onLog(`[${new Date().toLocaleTimeString()}] ⚠️ Trim/Rotate pre-step failed, falling back to original video.`);
        }
      }

      onProgress(30);
      onLog(`[${new Date().toLocaleTimeString()}] 📸 Extracting frames via FFmpeg...`);
      const fps = Number(extractStep.fps ?? 1);
      const imgFormat = String(extractStep.format ?? "png").toLowerCase();

      // Command: ffmpeg -i video.mp4 -vf fps=1 frame_%03d.png
      const framePattern = `frame_${sessionId}_%03d.${imgFormat}`;
      const extractArgs = [
        "-i",
        currentInputVideo,
        "-vf",
        `fps=${fps}`,
        "-vsync",
        "vfr",
        framePattern,
      ];

      onLog(`[${new Date().toLocaleTimeString()}] ⚙️ Executing frame extraction: ffmpeg ${extractArgs.join(" ")}`);
      const exitExtract = await ffmpeg.exec(extractArgs);
      if (exitExtract !== 0) {
        throw new Error(`Frame extraction failed with code ${exitExtract}`);
      }

      onProgress(50);
      onLog(`[${new Date().toLocaleTimeString()}] 📥 Reading extracted frames from Web VFS...`);

      // Read extracted frames matching sessionId
      const extractedImages: { name: string; blob: Blob }[] = [];
      let index = 1;
      while (true) {
        const name = `frame_${sessionId}_${String(index).padStart(3, "0")}.${imgFormat}`;
        try {
          const data = await ffmpeg.readFile(name);
          const mime = imgFormat === "jpeg" ? "image/jpeg" : imgFormat === "webp" ? "image/webp" : "image/png";
          const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: mime });
          extractedImages.push({ name: `frame_${String(index).padStart(3, "0")}.${imgFormat}`, blob });
          index++;
          // Safe guard to prevent infinite loops
          if (index > 2000) break;
        } catch {
          break; // No more files found
        }
      }

      onLog(`[${new Date().toLocaleTimeString()}] 📁 Extracted ${extractedImages.length} frames.`);
      if (extractedImages.length === 0) {
        throw new Error("No frames were extracted. Check video duration and FPS parameters.");
      }

      // Cleanup large files from FFmpeg VFS as early as possible
      try {
        await ffmpeg.deleteFile(inputName);
        if (currentInputVideo !== inputName) {
          await ffmpeg.deleteFile(currentInputVideo);
        }
        for (let i = 1; i < index; i++) {
          const name = `frame_${sessionId}_${String(i).padStart(3, "0")}.${imgFormat}`;
          await ffmpeg.deleteFile(name);
        }
      } catch {}

      onProgress(60);
      onLog(`[${new Date().toLocaleTimeString()}] 🔬 Processing image steps on Canvas for optimal speed...`);

      // Analyze Post-Extraction Batch Steps
      let resizeConfig: { width: number; height: number } | undefined;
      let removeBgConfig: { color: string; similarity: number; blend: number } | undefined;
      let finalFormat: "png" | "jpeg" | "webp" = imgFormat as any;

      for (const step of postSteps) {
        if (step.step === "resize") {
          resizeConfig = {
            width: Number(step.width ?? 512),
            height: Number(step.height ?? 512),
          };
        } else if (step.step === "remove_background") {
          removeBgConfig = {
            color: String(step.color ?? "green"),
            similarity: Number(step.similarity ?? 0.15),
            blend: Number(step.blend ?? 0.05),
          };
        } else if (step.step === "convert") {
          finalFormat = String(step.format ?? "png").toLowerCase() as any;
        }
      }

      onLog(`[${new Date().toLocaleTimeString()}] ⚡ Batch processing operations: ` +
        `[Resize: ${resizeConfig ? `${resizeConfig.width}x${resizeConfig.height}` : "None"}] ` +
        `[Remove BG: ${removeBgConfig ? `Color=${removeBgConfig.color}, Sim=${removeBgConfig.similarity}` : "None"}] ` +
        `[Format: ${finalFormat}]`);

      // Batch rendering
      const zip = new JSZip();
      let processedCount = 0;

      for (let i = 0; i < extractedImages.length; i++) {
        const item = extractedImages[i];
        try {
          const processedBlob = await processImageOnCanvas(item.blob, {
            resize: resizeConfig,
            removeBackground: removeBgConfig,
            format: finalFormat,
          });

          // Replace extension in output zip file name
          const baseName = item.name.substring(0, item.name.lastIndexOf("."));
          const outputName = `${baseName}.${finalFormat}`;

          zip.file(outputName, processedBlob);
          processedCount++;

          // Update progress fraction between 60% and 90%
          const batchPct = 60 + Math.round((i / extractedImages.length) * 30);
          onProgress(batchPct);
        } catch (imgError) {
          onLog(`[${new Date().toLocaleTimeString()}] ⚠️ Failed to process ${item.name}: ${imgError instanceof Error ? imgError.message : String(imgError)}`);
        }
      }

      onLog(`[${new Date().toLocaleTimeString()}] 📦 Packing ${processedCount} processed frames into ZIP archive...`);
      onProgress(92);
      const zipContent = await zip.generateAsync({ type: "blob" });
      onProgress(100);

      onLog(`[${new Date().toLocaleTimeString()}] ✅ Pipeline executed successfully. ZIP ready for download.`);
      return {
        blobUrl: URL.createObjectURL(zipContent),
        filename: `reframe_pipeline_dataset.zip`,
        isZip: true,
        filesCount: processedCount,
      };
    }
  } finally {
    ffmpeg.off("progress", progressHandler);
    ffmpeg.off("log", logHandler);
  }
}
