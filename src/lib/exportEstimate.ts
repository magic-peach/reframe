import { EditRecipe } from "./types";

// ---------------------------------------------------------------------------
// Preset dimension map
// Keep in sync with src/lib/presets.ts. Width × height for every named preset.
// ---------------------------------------------------------------------------
const PRESET_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1080p":   { width: 1920, height: 1080 },
  "720p":    { width: 1280, height: 720  },
  "480p":    { width: 854,  height: 480  },
  "360p":    { width: 640,  height: 360  },
  "4k":      { width: 3840, height: 2160 },
  "2k":      { width: 2560, height: 1440 },
  // Square / portrait presets
  "square-1080": { width: 1080, height: 1080 },
  "square-720":  { width: 720,  height: 720  },
  "portrait-1080": { width: 1080, height: 1920 },
  "portrait-720":  { width: 720,  height: 1280 },
  // Fallback — if a preset name is unrecognised we fall through to customWidth/H
};

/**
 * Resolve the actual output pixel dimensions for a recipe.
 * When a named preset is active we look it up; otherwise we use
 * the custom width/height the user typed in.
 */
function getOutputDimensions(recipe: EditRecipe): { width: number; height: number } {
  if (recipe.preset !== "custom") {
    const dims = PRESET_DIMENSIONS[recipe.preset];
    if (dims) return dims;
  }
  return { width: recipe.customWidth, height: recipe.customHeight };
}

// ---------------------------------------------------------------------------
// CRF → video bitrate (Mbps) — exponential fit to real-world H.264 data
//
// Reference points (1080p30, typical live-action content):
//   CRF 18 ≈ 8 Mbps   (visually lossless)
//   CRF 23 ≈ 3 Mbps   (default, good quality)
//   CRF 28 ≈ 1 Mbps   (acceptable)
//   CRF 30 ≈ 0.6 Mbps (small file)
//
// We model this as: bitrate = A * e^(-k * crf)
//   A = 8 * e^(k*18), k chosen so CRF 30 → 0.6 Mbps
//   k = ln(8/0.6) / (30-18) ≈ 0.2185
// ---------------------------------------------------------------------------
const CRF_A = 8 * Math.exp(0.2185 * 18); // ≈ 383
const CRF_K = 0.2185;

function videoBitrateFromCrf(crf: number): number {
  return CRF_A * Math.exp(-CRF_K * crf); // Mbps at 1080p
}

// ---------------------------------------------------------------------------
// Resolution multiplier relative to 1080p (pixel-count ratio, sqrt-damped)
//
// Pure pixel-count scaling over-estimates for high-res footage because
// encoders are more efficient at higher resolutions. A square-root damping
// gives a better empirical fit.
// ---------------------------------------------------------------------------
function resolutionMultiplier(width: number, height: number): number {
  const pixels = width * height;
  const refPixels = 1920 * 1080;
  const ratio = pixels / refPixels;
  // sqrt damping: 4K (4×pixels) → ~2× bitrate, not 4×
  return Math.max(Math.sqrt(ratio), 0.1);
}

// ---------------------------------------------------------------------------
// Format overhead factor
// MP4 and MKV are close; WebM (VP9) tends to produce slightly smaller files
// at the same CRF, so we apply a small discount.
// ---------------------------------------------------------------------------
function formatFactor(format: string | undefined): number {
  switch (format) {
    case "webm": return 0.85;
    case "mkv":  return 1.02;
    case "mp4":
    default:     return 1.0;
  }
}

// ---------------------------------------------------------------------------
// Audio bitrate estimate (Mbps)
// AAC 128 kbps for stereo — independent of video quality settings.
// ---------------------------------------------------------------------------
const AUDIO_BITRATE_MBPS = 0.128;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Estimate the output file size in **megabytes**.
 *
 * @param recipe   The current EditRecipe (preset, quality, speed, trim, format…)
 * @param duration Source video duration in seconds (used when trimEnd is null)
 * @returns        Estimated size in MB (floating-point)
 */
export function estimateExportSize(recipe: EditRecipe, duration: number): number {
  // 1. Effective playback duration after trimming
  const trimEnd = recipe.trimEnd ?? duration;
  const trimmedDuration = Math.max(trimEnd - recipe.trimStart, 1); // seconds

  // 2. Speed affects wall-clock output length but NOT the encoded content —
  //    a 2× speed export of a 60 s clip produces a 30 s file at the *same*
  //    bitrate. So we scale duration, not bitrate.
  const outputDuration = trimmedDuration / Math.max(recipe.speed, 0.25);

  // 3. Resolve pixel dimensions from preset or custom fields
  const { width, height } = getOutputDimensions(recipe);

  // 4. Video bitrate at the target resolution (Mbps)
  const videoBitrate =
    videoBitrateFromCrf(recipe.quality) *
    resolutionMultiplier(width, height) *
    formatFactor(recipe.format);

  // 5. Total bitrate = video + audio
  const totalBitrate = videoBitrate + AUDIO_BITRATE_MBPS;

  // 6. Size in megabytes  (Mbps × seconds / 8 = megabytes)
  const sizeMb = (totalBitrate * outputDuration) / 8;

  return sizeMb;
}

/**
 * Format a megabyte value into a human-readable approximate string.
 * Examples: "~320 KB", "~4.2 MB", "~1.3 GB"
 */
export function formatEstimatedSize(sizeMb: number): string {
  if (sizeMb >= 1024) {
    return `~${(sizeMb / 1024).toFixed(1)} GB`;
  }
  if (sizeMb < 1) {
    return `~${Math.round(sizeMb * 1024)} KB`;
  }
  return `~${sizeMb.toFixed(1)} MB`;
}