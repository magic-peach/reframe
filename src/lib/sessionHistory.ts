import { EditRecipe, TextOverlay } from "./types";
import { getPresetById } from "./presets";

export interface SessionState {
  id: string;
  timestamp: number;
  recipe: EditRecipe;
  actionType: "initial" | "manual" | "ai_prompt" | "milestone" | "rollback";
  description: string;
  category: "Layout" | "Color" | "Text" | "Audio" | "Speed" | "Macro" | "Manual" | "Initial";
  promptText?: string;
  isMilestone?: boolean;
  milestoneName?: string;
}

export interface RecipeDiff {
  key: string;
  label: string;
  fromVal: string;
  toVal: string;
  type: "added" | "removed" | "modified";
}

/**
 * Computes human-readable differences between two recipes.
 */
export function diffRecipes(r1: EditRecipe, r2: EditRecipe): RecipeDiff[] {
  const diffs: RecipeDiff[] = [];

  // 1. Preset & Aspect Ratio
  if (r1.preset !== r2.preset) {
    const p1 = getPresetById(r1.preset)?.label || r1.preset;
    const p2 = getPresetById(r2.preset)?.label || r2.preset;
    diffs.push({
      key: "preset",
      label: "Aspect Ratio",
      fromVal: p1,
      toVal: p2,
      type: "modified",
    });
  } else if (r1.preset === "custom" && (r1.customWidth !== r2.customWidth || r1.customHeight !== r2.customHeight)) {
    diffs.push({
      key: "resolution",
      label: "Resolution",
      fromVal: `${r1.customWidth}x${r1.customHeight}`,
      toVal: `${r2.customWidth}x${r2.customHeight}`,
      type: "modified",
    });
  }

  // 2. Framing
  if (r1.framing !== r2.framing) {
    diffs.push({
      key: "framing",
      label: "Framing Mode",
      fromVal: r1.framing,
      toVal: r2.framing,
      type: "modified",
    });
  }

  // 3. Trim
  if (r1.trimStart !== r2.trimStart || r1.trimEnd !== r2.trimEnd) {
    const formatTrim = (start: number, end: number | null) =>
      `${start.toFixed(1)}s - ${end !== null ? end.toFixed(1) + "s" : "End"}`;
    diffs.push({
      key: "trim",
      label: "Video Trim Range",
      fromVal: formatTrim(r1.trimStart, r1.trimEnd),
      toVal: formatTrim(r2.trimStart, r2.trimEnd),
      type: "modified",
    });
  }

  // 4. Rotation
  if (r1.rotate !== r2.rotate) {
    diffs.push({
      key: "rotate",
      label: "Rotation",
      fromVal: `${r1.rotate}°`,
      toVal: `${r2.rotate}°`,
      type: "modified",
    });
  }

  // 5. Audio
  if (r1.keepAudio !== r2.keepAudio) {
    diffs.push({
      key: "keepAudio",
      label: "Audio Track",
      fromVal: r1.keepAudio ? "Enabled" : "Muted",
      toVal: r2.keepAudio ? "Enabled" : "Muted",
      type: r2.keepAudio ? "added" : "removed",
    });
  }
  if (r1.normalizeAudio !== r2.normalizeAudio) {
    diffs.push({
      key: "normalizeAudio",
      label: "Audio Normalization",
      fromVal: r1.normalizeAudio ? "ON" : "OFF",
      toVal: r2.normalizeAudio ? "ON" : "OFF",
      type: "modified",
    });
  }

  // 6. Speed
  if (r1.speed !== r2.speed) {
    diffs.push({
      key: "speed",
      label: "Playback Speed",
      fromVal: `${r1.speed}x`,
      toVal: `${r2.speed}x`,
      type: "modified",
    });
  }

  // 7. Quality
  if (r1.quality !== r2.quality) {
    diffs.push({
      key: "quality",
      label: "Quality (CRF)",
      fromVal: String(r1.quality),
      toVal: String(r2.quality),
      type: "modified",
    });
  }

  // 8. Format
  if (r1.format !== r2.format) {
    diffs.push({
      key: "format",
      label: "Export Format",
      fromVal: r1.format.toUpperCase(),
      toVal: r2.format.toUpperCase(),
      type: "modified",
    });
  }

  // 9. Enhancements
  if (r1.stabilization !== r2.stabilization) {
    diffs.push({
      key: "stabilization",
      label: "Stabilization",
      fromVal: r1.stabilization ? "ON" : "OFF",
      toVal: r2.stabilization ? "ON" : "OFF",
      type: r2.stabilization ? "added" : "removed",
    });
  }
  if (r1.denoise !== (r2.denoise ?? false)) {
    diffs.push({
      key: "denoise",
      label: "Denoise Filter",
      fromVal: r1.denoise ? "ON" : "OFF",
      toVal: r2.denoise ? "ON" : "OFF",
      type: r2.denoise ? "added" : "removed",
    });
  }

  // 10. Image Enhancements
  if (r1.brightness !== r2.brightness) {
    diffs.push({
      key: "brightness",
      label: "Brightness",
      fromVal: r1.brightness.toFixed(1),
      toVal: r2.brightness.toFixed(1),
      type: "modified",
    });
  }
  if (r1.contrast !== r2.contrast) {
    diffs.push({
      key: "contrast",
      label: "Contrast",
      fromVal: r1.contrast.toFixed(1),
      toVal: r2.contrast.toFixed(1),
      type: "modified",
    });
  }
  if (r1.saturation !== r2.saturation) {
    diffs.push({
      key: "saturation",
      label: "Saturation",
      fromVal: r1.saturation.toFixed(1),
      toVal: r2.saturation.toFixed(1),
      type: "modified",
    });
  }

  // 11. Text Overlays
  const t1 = r1.textOverlays || [];
  const t2 = r2.textOverlays || [];
  if (t1.length !== t2.length) {
    diffs.push({
      key: "textOverlaysLength",
      label: "Text Overlay Count",
      fromVal: `${t1.length} overlays`,
      toVal: `${t2.length} overlays`,
      type: t2.length > t1.length ? "added" : "removed",
    });
  } else {
    // Check if texts changed
    for (let i = 0; i < t1.length; i++) {
      const item1 = t1[i];
      const item2 = t2[i];
      if (item1 && item2 && item1.text !== item2.text) {
        diffs.push({
          key: `textOverlayText_${item1.id}`,
          label: `Overlay Text #${i + 1}`,
          fromVal: `"${item1.text}"`,
          toVal: `"${item2.text}"`,
          type: "modified",
        });
      }
    }
  }

  return diffs;
}

/**
 * Parsed modifications from prompt
 */
interface CompiledResult {
  recipe: EditRecipe;
  logs: string[];
  category: SessionState["category"];
  description: string;
}

/**
 * Intelligent Client-Side AI Prompt compiler.
 * Translates natural language prompts into recipe updates and explanation logs.
 */
export function compileAIPrompt(prompt: string, currentRecipe: EditRecipe): CompiledResult {
  const recipe = JSON.parse(JSON.stringify(currentRecipe)) as EditRecipe;
  const logs: string[] = [];
  let category: SessionState["category"] = "Macro";

  // Clean prompt and split by "and", "then", commas, or semicolons for multi-turn execution
  const normalized = prompt.trim();
  const subPrompts = normalized.split(/\s+(?:and|then|,|;)\s+/i);

  subPrompts.forEach((sub) => {
    const s = sub.trim().toLowerCase();
    if (!s) return;

    // ── Presets & Aspect Ratios ──
    if (s.includes("tiktok") || s.includes("reel") || s.includes("shorts") || s.includes("portrait") || s.includes("9:16") || s.includes("9x16")) {
      recipe.preset = "vertical-9-16";
      logs.push("Set aspect ratio to 9:16 (TikTok / Reels / Shorts)");
      category = "Layout";
    } else if (s.includes("youtube") || s.includes("landscape") || s.includes("horizontal") || s.includes("16:9") || s.includes("16x9") || s.includes("widescreen")) {
      recipe.preset = "landscape-16-9";
      logs.push("Set aspect ratio to 16:9 (YouTube Landscape)");
      category = "Layout";
    } else if (s.includes("instagram feed") || s.includes("4:5") || s.includes("instagram post 4:5")) {
      recipe.preset = "instagram-4-5";
      logs.push("Set aspect ratio to 4:5 (Instagram Feed)");
      category = "Layout";
    } else if (s.includes("square") || s.includes("1:1") || s.includes("instagram post 1:1")) {
      recipe.preset = "square-1-1";
      logs.push("Set aspect ratio to 1:1 (Square)");
      category = "Layout";
    } else if (s.includes("ultrawide") || s.includes("21:9") || s.includes("21x9")) {
      recipe.preset = "ultrawide-21-9";
      logs.push("Set aspect ratio to 21:9 (Ultrawide)");
      category = "Layout";
    } else if (s.includes("cinema") || s.includes("scope") || s.includes("2.39")) {
      recipe.preset = "cinema-scope";
      logs.push("Set aspect ratio to 2.39:1 (Anamorphic Cinema)");
      category = "Layout";
    } else if (s.includes("twitter") || s.includes("x hd")) {
      recipe.preset = "twitter-hd";
      logs.push("Set aspect ratio to Twitter/X HD (1280x720)");
      category = "Layout";
    }

    // Custom dimensions (e.g., "resolution 1000x800", "custom size 1000 by 800")
    const customMatch = s.match(/(?:custom|resolution|size)\s+(\d+)\s*(?:x|by)\s*(\d+)/);
    if (customMatch && customMatch[1] && customMatch[2]) {
      const w = parseInt(customMatch[1]);
      const h = parseInt(customMatch[2]);
      if (w >= 16 && w <= 7680 && h >= 16 && h <= 7680) {
        recipe.preset = "custom";
        recipe.customWidth = w;
        recipe.customHeight = h;
        logs.push(`Set custom resolution to ${w}px × ${h}px`);
        category = "Layout";
      }
    }

    // ── Framing Mode ──
    if (s.includes("fill")) {
      recipe.framing = "fill";
      logs.push("Set framing mode to Fill (crop video to fill screen)");
      category = "Layout";
    } else if (s.includes("fit")) {
      recipe.framing = "fit";
      logs.push("Set framing mode to Fit (letterbox video to fit screen)");
      category = "Layout";
    }

    // ── Audio Controls ──
    if (s.includes("mute") || s.includes("silence") || s.includes("no audio") || s.includes("remove audio") || s.includes("strip audio")) {
      recipe.keepAudio = false;
      logs.push("Muted video audio track");
      category = "Audio";
    } else if (s.includes("unmute") || s.includes("keep audio") || s.includes("with sound") || s.includes("sound on")) {
      recipe.keepAudio = true;
      logs.push("Enabled video audio track");
      category = "Audio";
    }
    if (s.includes("normalize") || s.includes("normalize audio")) {
      recipe.normalizeAudio = true;
      logs.push("Enabled audio volume normalization");
      category = "Audio";
    }

    // ── Rotation ──
    if (s.includes("rotate 90") || s.includes("rotate clockwise") || s.includes("rotate right") || s.includes("turn right")) {
      recipe.rotate = 90;
      logs.push("Rotated video 90° clockwise");
      category = "Layout";
    } else if (s.includes("rotate 180") || s.includes("upside down") || s.includes("flip vertical")) {
      recipe.rotate = 180;
      logs.push("Rotated video 180°");
      category = "Layout";
    } else if (s.includes("rotate 270") || s.includes("rotate counter-clockwise") || s.includes("rotate counter clockwise") || s.includes("rotate left") || s.includes("turn left")) {
      recipe.rotate = 270;
      logs.push("Rotated video 270° (or 90° counter-clockwise)");
      category = "Layout";
    } else if (s.includes("rotate 0") || s.includes("reset rotation") || s.includes("no rotation")) {
      recipe.rotate = 0;
      logs.push("Reset video rotation to 0°");
      category = "Layout";
    }

    // ── Speed Controls ──
    if (s.includes("double speed") || s.includes("speed up to 2x") || s.includes("2x speed") || s.includes("fast forward 2x") || s.includes("timelapse 2x")) {
      recipe.speed = 2;
      logs.push("Set playback speed to 2.0x (Double Speed)");
      category = "Speed";
    } else if (s.includes("speed up to 4x") || s.includes("4x speed") || s.includes("timelapse 4x")) {
      recipe.speed = 4;
      logs.push("Set playback speed to 4.0x (Quadruple Speed)");
      category = "Speed";
    } else if (s.includes("slow motion") || s.includes("speed 0.5x") || s.includes("half speed") || s.includes("0.5x speed")) {
      recipe.speed = 0.5;
      logs.push("Set playback speed to 0.5x (Slow Motion)");
      category = "Speed";
    } else if (s.includes("quarter speed") || s.includes("speed 0.25x") || s.includes("0.25x speed")) {
      recipe.speed = 0.25;
      logs.push("Set playback speed to 0.25x (Quarter Speed)");
      category = "Speed";
    } else if (s.includes("normal speed") || s.includes("speed 1x") || s.includes("1x speed") || s.includes("reset speed")) {
      recipe.speed = 1;
      logs.push("Reset playback speed to normal (1.0x)");
      category = "Speed";
    } else if (s.includes("speed up") || s.includes("faster")) {
      // Find numbers like speed 1.5x
      const speedMatch = s.match(/(?:speed|rate)\s+(?:of\s+)?(\d+(?:\.\d+)?)(?:x)?/);
      if (speedMatch && speedMatch[1]) {
        const val = parseFloat(speedMatch[1]);
        if ([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].includes(val)) {
          recipe.speed = val;
          logs.push(`Set playback speed to ${val}x`);
          category = "Speed";
        }
      }
    }

    // ── Quality Settings ──
    if (s.includes("high quality") || s.includes("hd quality") || s.includes("max quality") || s.includes("best quality")) {
      recipe.quality = 18;
      logs.push("Configured maximum quality export (CRF 18)");
      category = "Macro";
    } else if (s.includes("low quality") || s.includes("small file") || s.includes("compact size")) {
      recipe.quality = 30;
      logs.push("Configured small file size export (CRF 30)");
      category = "Macro";
    } else if (s.includes("medium quality") || s.includes("balanced quality") || s.includes("standard quality")) {
      recipe.quality = 24;
      logs.push("Configured balanced quality export (CRF 24)");
      category = "Macro";
    }

    // ── Format Settings ──
    if (s.includes("export as mp4") || s.includes("mp4 format") || s.includes("convert to mp4")) {
      recipe.format = "mp4";
      logs.push("Changed export format to MP4");
      category = "Macro";
    } else if (s.includes("export as webm") || s.includes("webm format") || s.includes("convert to webm")) {
      recipe.format = "webm";
      logs.push("Changed export format to WebM");
      category = "Macro";
    } else if (s.includes("export as gif") || s.includes("gif format") || s.includes("convert to gif") || s.includes("make a gif") || s.includes("make gif")) {
      recipe.format = "gif";
      recipe.keepAudio = false; // force off
      logs.push("Changed export format to GIF (Muted automatically)");
      category = "Macro";
    } else if (s.includes("export as mkv") || s.includes("mkv format") || s.includes("convert to mkv")) {
      recipe.format = "mkv";
      logs.push("Changed export format to MKV");
      category = "Macro";
    }

    // ── Enhancements ──
    if (s.includes("stabilize") || s.includes("stabilization") || s.includes("reduce shake")) {
      recipe.stabilization = true;
      logs.push("Enabled camera stabilization filter");
      category = "Macro";
    } else if (s.includes("destabilize") || s.includes("disable stabilization")) {
      recipe.stabilization = false;
      logs.push("Disabled camera stabilization");
      category = "Macro";
    }
    if (s.includes("denoise") || s.includes("remove noise") || s.includes("reduce noise")) {
      recipe.denoise = true;
      logs.push("Enabled audio/video noise reduction filter");
      category = "Macro";
    }

    // ── Brightness, Contrast, Saturation ──
    // Contrast
    if (s.includes("high contrast") || s.includes("increase contrast") || s.includes("more contrast")) {
      recipe.contrast = 1.4;
      logs.push("Increased contrast to 1.4");
      category = "Color";
    } else if (s.includes("low contrast") || s.includes("reduce contrast") || s.includes("less contrast")) {
      recipe.contrast = 0.7;
      logs.push("Reduced contrast to 0.7");
      category = "Color";
    } else if (s.includes("reset contrast")) {
      recipe.contrast = 1.0;
      logs.push("Reset contrast to normal (1.0)");
      category = "Color";
    } else {
      const contrastMatch = s.match(/contrast\s+(?:to\s+)?(\d+(?:\.\d+)?)/);
      if (contrastMatch && contrastMatch[1]) {
        const val = parseFloat(contrastMatch[1]);
        if (val >= 0 && val <= 2) {
          recipe.contrast = val;
          logs.push(`Set contrast to ${val}`);
          category = "Color";
        }
      }
    }

    // Brightness
    if (s.includes("brighter") || s.includes("brighten") || s.includes("increase brightness") || s.includes("more light")) {
      recipe.brightness = 0.3;
      logs.push("Increased brightness to +0.3");
      category = "Color";
    } else if (s.includes("darker") || s.includes("darken") || s.includes("reduce brightness") || s.includes("less light")) {
      recipe.brightness = -0.3;
      logs.push("Reduced brightness to -0.3");
      category = "Color";
    } else if (s.includes("reset brightness")) {
      recipe.brightness = 0.0;
      logs.push("Reset brightness to normal (0.0)");
      category = "Color";
    } else {
      const brightnessMatch = s.match(/brightness\s+(?:to\s+)?(-?\d+(?:\.\d+)?)/);
      if (brightnessMatch && brightnessMatch[1]) {
        const val = parseFloat(brightnessMatch[1]);
        if (val >= -1 && val <= 1) {
          recipe.brightness = val;
          logs.push(`Set brightness to ${val}`);
          category = "Color";
        }
      }
    }

    // Saturation
    if (s.includes("vibrant") || s.includes("colorful") || s.includes("increase saturation") || s.includes("boost colors")) {
      recipe.saturation = 1.6;
      logs.push("Increased saturation to 1.6 (Vibrant Mode)");
      category = "Color";
    } else if (s.includes("grayscale") || s.includes("monochrome") || s.includes("black and white") || s.includes("black & white") || s.includes("no color")) {
      recipe.saturation = 0.0;
      logs.push("Set saturation to 0.0 (Grayscale / Black & White)");
      category = "Color";
    } else if (s.includes("reset saturation")) {
      recipe.saturation = 1.0;
      logs.push("Reset saturation to normal (1.0)");
      category = "Color";
    } else {
      const saturationMatch = s.match(/saturation\s+(?:to\s+)?(\d+(?:\.\d+)?)/);
      if (saturationMatch && saturationMatch[1]) {
        const val = parseFloat(saturationMatch[1]);
        if (val >= 0 && val <= 3) {
          recipe.saturation = val;
          logs.push(`Set saturation to ${val}`);
          category = "Color";
        }
      }
    }

    // ── Text Overlays ──
    // Handle: add text "Cool Title" or add title 'My Vlog' or overlay text "Hello"
    const textMatch = sub.match(/(?:add|insert|create|overlay)\s+(?:text|title|caption)\s+["'“‘]([^"'”’]+)["'”’]/i);
    if (textMatch && textMatch[1]) {
      const textVal = textMatch[1];
      const newOverlay: TextOverlay = {
        id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        text: textVal,
        x: 50,
        y: 40 + (recipe.textOverlays?.length || 0) * 12, // Cascade slightly
        fontSize: 36,
        color: "#ffffff",
        fontWeight: "bold",
      };
      recipe.textOverlays = [...(recipe.textOverlays || []), newOverlay];
      logs.push(`Added text overlay: "${textVal}"`);
      category = "Text";
    } else if (s.includes("clear text") || s.includes("remove text") || s.includes("delete text") || s.includes("clear overlays")) {
      recipe.textOverlays = [];
      logs.push("Removed all text overlays");
      category = "Text";
    }

    // ── Macro Cinematic / Vlog / Shorts presets ──
    if (s.includes("cinematic look") || s.includes("cinematic preset")) {
      recipe.preset = "cinema-scope";
      recipe.contrast = 1.2;
      recipe.saturation = 1.1;
      recipe.brightness = -0.05;
      logs.push("Applied Cinematic Macro (2.39:1 scope, high contrast, subtle dimming)");
      category = "Macro";
    } else if (s.includes("vlog preset") || s.includes("vlog style")) {
      recipe.saturation = 1.35;
      recipe.brightness = 0.05;
      recipe.contrast = 1.05;
      logs.push("Applied Vlog Macro (warm tones, high saturation, slight brighten)");
      category = "Macro";
    }
  });

  // Synthesize description
  let description = "AI Prompt";
  if (logs.length > 0) {
    if (logs.length === 1) {
      description = `AI: ${logs[0]}`;
    } else if (logs.length === 2) {
      description = `AI: ${logs[0]} & ${logs[1]}`;
    } else {
      description = `AI: Modified ${logs.length} settings (${category})`;
    }
  } else {
    logs.push("No changes recognized. Try 'make it vertical' or 'add text \"Awesome Video\"'");
    description = "AI Prompt: No changes applied";
  }

  return {
    recipe,
    logs,
    category,
    description,
  };
}

/**
 * Storage Helpers
 */
export function getStorageKey(fileKey: string): string {
  return `reframe:session:${fileKey}`;
}

export function saveSessionHistory(fileKey: string, states: SessionState[]): void {
  if (typeof window === "undefined" || !fileKey) return;
  try {
    // Limit to last 50 states to prevent localStorage overflow
    const trimmed = states.slice(-50);
    localStorage.setItem(getStorageKey(fileKey), JSON.stringify(trimmed));
  } catch (err) {
    console.error("Failed to save session history:", err);
  }
}

export function loadSessionHistory(fileKey: string): SessionState[] {
  if (typeof window === "undefined" || !fileKey) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(fileKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load session history:", err);
  }
  return [];
}

export function clearSessionHistory(fileKey: string): void {
  if (typeof window === "undefined" || !fileKey) return;
  try {
    localStorage.removeItem(getStorageKey(fileKey));
  } catch (err) {
    console.error("Failed to clear session history:", err);
  }
}
