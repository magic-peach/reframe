#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */

const { spawnSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// --- ANSI Escape Codes for Colors ---
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GRAY = "\x1b[90m";

// --- Types ---
interface PipelineStep {
  step: string;
  [key: string]: any;
}

interface PipelineConfig {
  name?: string;
  pipeline: PipelineStep[];
}

// --- CLI Argument Parsing ---
function printHelp() {
  console.log(`
${BOLD}${GREEN}Reframe CLI Pipeline Runner${RESET}
======================================
Automate media preprocessing pipelines via YAML/JSON workflow files.

${BOLD}Usage:${RESET}
  npx ts-node scripts/pipeline-cli.ts run <config-file> <input-file> [options]

${BOLD}Options:${RESET}
  --out <dir>      Output directory for processed files (default: ./output)
  --help, -h       Show this help message

${BOLD}Example:${RESET}
  npx ts-node scripts/pipeline-cli.ts run pipeline.yaml input.mp4 --out ./processed_dataset
`);
}

// Check for system ffmpeg dependency with helpful install guides
function checkSystemFFmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch {
    console.error(`\n${RED}${BOLD}❌ Error: 'ffmpeg' binary is not found in your system's PATH.${RESET}`);
    console.error(`\n${YELLOW}${BOLD}How to fix this:${RESET}`);
    console.error(`Reframe CLI runs pipelines locally using your system's native FFmpeg binary.`);
    console.error(`Please install FFmpeg using one of the commands below depending on your OS:\n`);
    
    console.error(`${BOLD}Windows (PowerShell/CMD):${RESET}`);
    console.error(`  winget install Gyan.FFmpeg`);
    console.error(`  ${GRAY}(Then close and reopen your terminal session)${RESET}\n`);

    console.error(`${BOLD}macOS (Homebrew):${RESET}`);
    console.error(`  brew install ffmpeg\n`);

    console.error(`${BOLD}Linux (Debian/Ubuntu):${RESET}`);
    console.error(`  sudo apt update && sudo apt install -y ffmpeg\n`);
    
    console.error(`${GRAY}Note: The Reframe Web application runs FFmpeg.wasm in-browser automatically without needing any system installation!${RESET}\n`);
    process.exit(1);
  }
}

// --- Simple YAML/JSON Parser ---
function parsePipelineConfig(filePath: string): PipelineConfig {
  if (!fs.existsSync(filePath)) {
    console.error(`${RED}Error: Config file not found: ${filePath}${RESET}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8").trim();

  if (filePath.endsWith(".json") || content.startsWith("{")) {
    try {
      return JSON.parse(content) as PipelineConfig;
    } catch (e) {
      console.error(`${RED}Error: Failed to parse JSON: ${(e as Error).message}${RESET}`);
      process.exit(1);
    }
  }

  // Parse YAML simply
  try {
    const lines = content.split("\n");
    const result: PipelineConfig = { pipeline: [] };
    let currentStep: PipelineStep | null = null;

    for (let line of lines) {
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
      throw new Error("No pipeline steps found under 'pipeline:' key.");
    }

    return result;
  } catch (e) {
    console.error(`${RED}Error parsing YAML config: ${(e as Error).message}${RESET}`);
    process.exit(1);
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

function parseColorToHex(colorStr: string): string {
  const c = colorStr.toLowerCase().trim();
  if (c === "green") return "0x00FF00";
  if (c === "blue") return "0x0000FF";
  if (c === "red") return "0xFF0000";
  if (c === "black") return "0x000000";
  if (c === "white") return "0xFFFFFF";

  const hex = c.startsWith("#") ? c.slice(1) : c;
  if (hex.length === 6) {
    return `0x${hex}`;
  }
  return "0x00FF00";
}

// --- Main Execution ---
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const command = args[0];
  if (command !== "run") {
    console.error(`${RED}Error: Unknown command "${command}". Use "run".${RESET}`);
    printHelp();
    process.exit(1);
  }

  const configFile = args[1];
  const inputFile = args[2];

  if (!configFile || !inputFile) {
    console.error(`${RED}Error: Missing required arguments config-file or input-file.${RESET}`);
    printHelp();
    process.exit(1);
  }

  let outDir = "./output";
  const outIndex = args.indexOf("--out");
  if (outIndex !== -1 && args[outIndex + 1]) {
    outDir = args[outIndex + 1];
  }

  checkSystemFFmpeg();

  console.log(`${BOLD}${GREEN}🚀 Starting Reframe CLI pipeline...${RESET}`);
  console.log(`${GRAY}Config:${RESET} ${configFile}`);
  console.log(`${GRAY}Input:${RESET}  ${inputFile}`);
  console.log(`${GRAY}Output:${RESET} ${outDir}\n`);

  const config = parsePipelineConfig(configFile);
  console.log(`${BOLD}📂 Loaded pipeline${config.name ? `: "${config.name}"` : ""} with ${config.pipeline.length} steps.${RESET}`);

  // Create output directory
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const extractStepIndex = config.pipeline.findIndex((s: PipelineStep) => s.step === "extract_frames");
  const hasFrameExtraction = extractStepIndex !== -1;

  if (!hasFrameExtraction) {
    // --- Scenario A: Video pipeline ---
    console.log(`\n${BLUE}${BOLD}[STAGE 1/1] Running single-pass video transcode...${RESET}`);
    
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
        const hex = parseColorToHex(col);
        vfFilters.push(`chromakey=color=${hex}:similarity=${sim}:blend=${bld}`);
      } else if (step.step === "convert") {
        format = String(step.format ?? "mp4").toLowerCase();
      }
    }

    const ffmpegArgs: string[] = [];
    
    if (hasTrim) {
      ffmpegArgs.push("-ss", String(trimStart));
    }
    ffmpegArgs.push("-i", inputFile);
    if (hasTrim && trimEnd !== null) {
      ffmpegArgs.push("-to", String(trimEnd));
    }

    if (vfFilters.length > 0) {
      ffmpegArgs.push("-vf", vfFilters.join(","));
    }

    const outExt = format === "webm" ? "webm" : format === "mkv" ? "mkv" : "mp4";
    const outPath = path.join(outDir, `reframe_output.${outExt}`);

    if (outExt === "webm") {
      ffmpegArgs.push("-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-c:a", "libopus");
    } else if (outExt === "mkv") {
      ffmpegArgs.push("-c:v", "libx264", "-crf", "23", "-c:a", "aac");
    } else {
      ffmpegArgs.push("-c:v", "libx264", "-crf", "23", "-preset", "medium", "-c:a", "aac", "-pix_fmt", "yuv420p");
    }

    ffmpegArgs.push("-y", outPath);

    console.log(`${GRAY}Executing command: ffmpeg ${ffmpegArgs.join(" ")}${RESET}`);
    
    const result = spawnSync("ffmpeg", ffmpegArgs, { stdio: "inherit" });
    if (result.status !== 0) {
      console.error(`\n${RED}${BOLD}❌ Transcoding failed with exit code ${result.status}${RESET}`);
      process.exit(1);
    }

    console.log(`\n${GREEN}${BOLD}✅ Pipeline finished successfully!${RESET}`);
    console.log(`Saved output video to: ${outPath}\n`);

  } else {
    // --- Scenario B: Frame extraction & batch frame processing ---
    const preSteps = config.pipeline.slice(0, extractStepIndex);
    const extractStep = config.pipeline[extractStepIndex];
    const postSteps = config.pipeline.slice(extractStepIndex + 1);

    const tempDir = path.join(outDir, ".reframe_temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log(`\n${BLUE}${BOLD}[STAGE 1/3] Preprocessing video & frame extraction...${RESET}`);

    let currentInputVideo = inputFile;
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
      const intermediateVideo = path.join(tempDir, "preprocessed.mp4");
      const intermediateArgs = ["-y"];
      if (hasTrim) intermediateArgs.push("-ss", String(trimStart));
      intermediateArgs.push("-i", currentInputVideo);
      if (hasTrim && trimEnd !== null) intermediateArgs.push("-to", String(trimEnd));
      if (preVf.length > 0) intermediateArgs.push("-vf", preVf.join(","));
      intermediateArgs.push("-c:a", "copy", intermediateVideo);

      console.log(`${GRAY}Running pre-extraction filter: ffmpeg ${intermediateArgs.join(" ")}${RESET}`);
      const interResult = spawnSync("ffmpeg", intermediateArgs, { stdio: "ignore" });
      if (interResult.status === 0) {
        currentInputVideo = intermediateVideo;
      }
    }

    const fps = Number(extractStep.fps ?? 1);
    const imgFormat = String(extractStep.format ?? "png").toLowerCase();

    // Extract frames command
    const extractPattern = path.join(tempDir, "frame_%03d." + imgFormat);
    const extractArgs = [
      "-y",
      "-i", currentInputVideo,
      "-vf", `fps=${fps}`,
      "-vsync", "vfr",
      extractPattern
    ];

    console.log(`${GRAY}Running extraction: ffmpeg ${extractArgs.join(" ")}${RESET}`);
    const extractResult = spawnSync("ffmpeg", extractArgs, { stdio: "inherit" });
    if (extractResult.status !== 0) {
      console.error(`\n${RED}❌ Frame extraction failed.${RESET}`);
      cleanupTemp(tempDir);
      process.exit(1);
    }

    const extractedFiles = fs.readdirSync(tempDir)
      .filter((f: string) => f.startsWith("frame_") && f.endsWith("." + imgFormat))
      .sort();

    console.log(`\n${GREEN}📁 Extracted ${extractedFiles.length} frames successfully.${RESET}`);

    console.log(`\n${BLUE}${BOLD}[STAGE 2/3] Batch processing frame images...${RESET}`);

    let resizeConfig = null;
    let removeBgConfig = null;
    let finalFormat = imgFormat;

    for (const step of postSteps) {
      if (step.step === "resize") {
        resizeConfig = {
          width: Number(step.width ?? 512),
          height: Number(step.height ?? 512),
          fit: step.fit ?? "contain",
        };
      } else if (step.step === "remove_background") {
        removeBgConfig = {
          color: String(step.color ?? "green"),
          similarity: Number(step.similarity ?? 0.15),
          blend: Number(step.blend ?? 0.05),
        };
      } else if (step.step === "convert") {
        finalFormat = String(step.format ?? "png").toLowerCase();
      }
    }

    let processedCount = 0;

    for (const file of extractedFiles) {
      const srcPath = path.join(tempDir, file);
      const outputFilename = file.replace("." + imgFormat, "." + finalFormat);
      const dstPath = path.join(outDir, outputFilename);

      const postVf = [];

      if (removeBgConfig) {
        const hex = parseColorToHex(removeBgConfig.color);
        postVf.push(`chromakey=color=${hex}:similarity=${removeBgConfig.similarity}:blend=${removeBgConfig.blend}`);
      }

      if (resizeConfig) {
        const w = Math.round((resizeConfig as any).width / 2) * 2;
        const h = Math.round((resizeConfig as any).height / 2) * 2;
        if ((resizeConfig as any).fit === "contain") {
          postVf.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black`);
        } else {
          postVf.push(`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`);
        }
      }

      const postArgs = ["-y", "-i", srcPath];
      if (postVf.length > 0) {
        postArgs.push("-vf", postVf.join(","));
      }
      postArgs.push(dstPath);

      const singleResult = spawnSync("ffmpeg", postArgs, { stdio: "ignore" });
      if (singleResult.status === 0) {
        processedCount++;
        process.stdout.write(`\r${GRAY}Processed ${processedCount}/${extractedFiles.length} frames...${RESET}`);
      }
    }

    console.log(`\n\n${BLUE}${BOLD}[STAGE 3/3] Cleaning up temporary files...${RESET}`);
    cleanupTemp(tempDir);

    console.log(`\n${GREEN}${BOLD}✅ Pipeline finished successfully!${RESET}`);
    console.log(`Saved ${processedCount} processed frames to: ${outDir}\n`);
  }
}

function cleanupTemp(dir: string) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file: string) => {
      fs.unlinkSync(path.join(dir, file));
    });
    fs.rmdirSync(dir);
  }
}

main();
