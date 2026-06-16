"use client";

import { useState, useEffect, useRef } from "react";

// Max file size before we skip waveform generation (500 MB)
const MAX_WAVEFORM_FILE_SIZE = 500 * 1024 * 1024;

// How many data points to render in the waveform
const WAVEFORM_SAMPLES = 200;

interface UseAudioWaveformResult {
  peaks: number[];        // normalized 0–1 amplitude values
  isLoading: boolean;
  error: string | null;
}

export function useAudioWaveform(file: File | null): UseAudioWaveformResult {
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!file) {
      setPeaks([]);
      return;
    }

    // --- Layer 1: File size guard ---
    if (file.size > MAX_WAVEFORM_FILE_SIZE) {
      setError("File too large to generate waveform preview (>500 MB).");
      setPeaks([]);
      return;
    }

    let cancelled = false;

    const generateWaveform = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Close any existing AudioContext to free memory
        if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }

        const AudioContextCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;

        audioContextRef.current = new AudioContextCtor();

        // Read file into memory (unavoidable for decodeAudioData)
        const arrayBuffer = await file.arrayBuffer();

        if (cancelled) return;

        const audioBuffer = await audioContextRef.current.decodeAudioData(
          arrayBuffer
        );

        if (cancelled) return;

        // --- Layer 2: Extract peaks immediately, release the big buffer ---
        const channelData = audioBuffer.getChannelData(0); // mono / left channel
        const blockSize = Math.floor(channelData.length / WAVEFORM_SAMPLES);

        const extractedPeaks: number[] = [];

        for (let i = 0; i < WAVEFORM_SAMPLES; i++) {
          let max = 0;
          const start = i * blockSize;
          const end = start + blockSize;

          for (let j = start; j < end; j++) {
            const abs = Math.abs(channelData[j]);
            if (abs > max) max = abs;
          }

          extractedPeaks.push(max);
        }

        // Normalize so the tallest peak = 1.0
        const globalMax = Math.max(...extractedPeaks, 1e-6);
        const normalizedPeaks = extractedPeaks.map((v) => v / globalMax);

        // audioBuffer is now eligible for GC — we hold only the small peaks array
        if (!cancelled) {
          setPeaks(normalizedPeaks);
        }

        // Close context to free Web Audio resources
        await audioContextRef.current.close();
        audioContextRef.current = null;

      } catch (err) {
        if (!cancelled) {
          console.error("Waveform generation failed:", err);
          setError("Could not generate waveform for this file.");
          setPeaks([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    generateWaveform();

    // Cleanup: cancel if file changes before decode finishes
    return () => {
      cancelled = true;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [file]);

  return { peaks, isLoading, error };
}
