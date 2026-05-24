"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_WAVEFORM_BAR_COUNT,
  DEFAULT_WAVEFORM_MAX_FILE_SIZE,
  DEFAULT_WAVEFORM_TIMEOUT_MS,
  getWaveformSkipReason,
} from "@/lib/waveform";

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
  barCount = DEFAULT_WAVEFORM_BAR_COUNT
) {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [skipReason, setSkipReason] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let audioContext: AudioContext | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function extractWaveform() {
      if (!file) {
        setWaveform([]);
        setIsLoading(false);
        setSkipReason(null);
        return;
      }

      const reason = getWaveformSkipReason(
        file.size,
        DEFAULT_WAVEFORM_MAX_FILE_SIZE,
      );

      if (reason) {
        setWaveform([]);
        setIsLoading(false);
        setSkipReason(reason);
        return;
      }

      const AudioContextCtor =
        window.AudioContext || (window as BrowserWindow).webkitAudioContext;

      if (!AudioContextCtor) {
        setWaveform([]);
        setIsLoading(false);
        setSkipReason("Waveform preview is not supported in this browser.");
        return;
      }

      setIsLoading(true);
      setSkipReason(null);

      try {
        audioContext = new AudioContextCtor();
        const decodePromise = audioContext.decodeAudioData(
          await file.arrayBuffer(),
        );
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Waveform extraction timed out"));
          }, DEFAULT_WAVEFORM_TIMEOUT_MS);
        });

        const audioBuffer = await Promise.race([decodePromise, timeoutPromise]);
        const channelData = audioBuffer.getChannelData(0);
        const peaks = downsampleWaveform(channelData, barCount);

        if (!isCancelled) {
          setWaveform(peaks);
          setSkipReason(null);
        }
      } catch {
        if (!isCancelled) {
          setWaveform([]);
          setSkipReason("Waveform preview could not be generated for this file.");
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
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

  return { waveform, isLoading, skipReason };
}
