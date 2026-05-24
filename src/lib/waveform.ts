import { formatBytes } from "@/lib/utils";

export const DEFAULT_WAVEFORM_BAR_COUNT = 96;
export const DEFAULT_WAVEFORM_MAX_FILE_SIZE = 50 * 1024 * 1024;
export const DEFAULT_WAVEFORM_TIMEOUT_MS = 15000;

export function getWaveformSkipReason(
  fileSize: number,
  maxFileSizeBytes = DEFAULT_WAVEFORM_MAX_FILE_SIZE,
): string | null {
  if (!Number.isFinite(fileSize) || fileSize <= 0) return null;

  if (fileSize <= maxFileSizeBytes) return null;

  return `Waveform preview skipped for files larger than ${formatBytes(maxFileSizeBytes, 0)}.`;
}
