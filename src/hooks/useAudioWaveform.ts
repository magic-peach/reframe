"use client";

import { useEffect, useState } from "react";
import { MAX_WAVEFORM_FILE_SIZE_BYTES } from "@/lib/constants";

const DEFAULT_BAR_COUNT = 96;

/**
 * Lifecycle of a waveform extraction request:
 * - `idle`     — no file selected.
 * - `loading`  — reading/decoding audio.
 * - `ready`    — `waveform` holds the downsampled peaks.
 * - `disabled` — file exceeds the size threshold; extraction was skipped to
 *                keep memory bounded (#1013). UI should show a placeholder.
 * - `error`    — decoding failed or Web Audio is unavailable.
 */
export type WaveformStatus = "idle" | "loading" | "ready" | "disabled" | "error";

export interface UseAudioWaveformResult {
  waveform: number[];
  status: WaveformStatus;
  /** Convenience flag, retained for backward compatibility. */
  isLoading: boolean;
}

type BrowserWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function downsampleWaveform(channelData: Float32Array, barCount: number): number[] {
  const sampleSize = Math.max(1, Math.floor(channelData.length / barCount));
  const peaks = Array.from({ length: barCount }, (_, index) => {
    const start = index * sampleSize;
    const end = Math.min(start + sampleSize, channelData.length);
    let peak = 0;

    for (let i = start; i < end; i += 1) {
      peak = Math.max(peak, Math.abs(channelData[i] ?? 0));
    }

    return peak;
  });

  const maxPeak = Math.max(...peaks, 0.01);
  return peaks.map((peak) => peak / maxPeak);
}

/**
 * Extracts a low-resolution audio waveform from a media file.
 *
 * Memory safety (#1013): files larger than `maxFileSizeBytes` are not read into
 * memory at all — the hook reports `status: "disabled"` and the caller renders a
 * placeholder instead. Within the threshold the audio is read through a bounded
 * `Blob.slice` so the amount of data handed to `decodeAudioData` never exceeds
 * the threshold, even if the underlying file grows unexpectedly. Small files
 * (the common case) are read in full exactly as before — no behavioural change.
 */
export function useAudioWaveform(
  file: File | null,
  barCount = DEFAULT_BAR_COUNT,
  maxFileSizeBytes = MAX_WAVEFORM_FILE_SIZE_BYTES
): UseAudioWaveformResult {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [status, setStatus] = useState<WaveformStatus>("idle");

  useEffect(() => {
    let isCancelled = false;
    let audioContext: AudioContext | null = null;

    async function extractWaveform() {
      if (!file) {
        setWaveform([]);
        setStatus("idle");
        return;
      }

      // Hard memory guard: never pull a multi-gigabyte file into the heap.
      if (file.size > maxFileSizeBytes) {
        setWaveform([]);
        setStatus("disabled");
        return;
      }

      const AudioContextCtor =
        window.AudioContext || (window as BrowserWindow).webkitAudioContext;

      if (!AudioContextCtor) {
        setWaveform([]);
        setStatus("error");
        return;
      }

      setWaveform([]);
      setStatus("loading");

      try {
        // Read at most `maxFileSizeBytes`. For files within the threshold this
        // is the whole file (unchanged); the slice bounds the allocation so we
        // never decode more than the threshold's worth of bytes.
        const audioBytes = await file.slice(0, maxFileSizeBytes).arrayBuffer();
        if (isCancelled) return;

        audioContext = new AudioContextCtor();
        const audioBuffer = await audioContext.decodeAudioData(audioBytes);
        if (isCancelled) return;

        const channelData = audioBuffer.getChannelData(0);
        const peaks = downsampleWaveform(channelData, barCount);

        if (!isCancelled) {
          setWaveform(peaks);
          setStatus("ready");
        }
      } catch {
        if (!isCancelled) {
          setWaveform([]);
          setStatus("error");
        }
      } finally {
        await audioContext?.close();
      }
    }

    extractWaveform();

    // Cancellation: a new file, a changed bar count, or an unmount stops the
    // in-flight read/decode and prevents state updates on a dead component.
    return () => {
      isCancelled = true;
    };
  }, [barCount, file, maxFileSizeBytes]);

  return { waveform, status, isLoading: status === "loading" };
}
