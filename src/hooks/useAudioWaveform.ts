"use client";

import { useEffect, useState } from "react";

const DEFAULT_BAR_COUNT = 96;
export const MAX_WAVEFORM_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const LARGE_FILE_WAVEFORM_MESSAGE =
  "Waveform preview is disabled for files larger than 50 MB.";

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

export function useAudioWaveform(
  file: File | null,
  barCount = DEFAULT_BAR_COUNT
) {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [waveformError, setWaveformError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let audioContext: AudioContext | null = null;

    async function extractWaveform() {
      if (!file) {
        setWaveform([]);
        setWaveformError(null);
        setIsLoading(false);
        return;
      }

      if (file.size > MAX_WAVEFORM_FILE_SIZE_BYTES) {
        setWaveform([]);
        setWaveformError(LARGE_FILE_WAVEFORM_MESSAGE);
        setIsLoading(false);
        return;
      }

      const AudioContextCtor =
        window.AudioContext || (window as BrowserWindow).webkitAudioContext;

      if (!AudioContextCtor) {
        setWaveform([]);
        setWaveformError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setWaveformError(null);

      try {
        audioContext = new AudioContextCtor();
        const audioBuffer = await audioContext.decodeAudioData(
          await file.arrayBuffer()
        );
        const channelData = audioBuffer.getChannelData(0);
        const peaks = downsampleWaveform(channelData, barCount);

        if (!isCancelled) {
          setWaveform(peaks);
        }
      } catch {
        if (!isCancelled) {
          setWaveform([]);
          setWaveformError("Unable to generate waveform preview for this file.");
        }
      } finally {
        await audioContext?.close();
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    extractWaveform();

    return () => {
      isCancelled = true;
    };
  }, [barCount, file]);

  return { waveform, isLoading, waveformError };
}
