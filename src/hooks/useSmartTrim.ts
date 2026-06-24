'use client';

import { useState, useCallback } from 'react';
import { detectSilence } from '@/lib/ffmpeg';
import type { SilenceSegment, SmartTrimStatus } from '@/lib/types';

interface UseSmartTrimReturn {
  status: SmartTrimStatus;
  segments: SilenceSegment[];
  runDetection: (file: File, noiseDb?: number, minDuration?: number) => Promise<void>;
  toggleSegment: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  applyTrim: () => { keepRanges: Array<{ start: number; end: number }> };
  reset: () => void;
  error: string | null;
}

export function useSmartTrim(videoDuration: number): UseSmartTrimReturn {
  const [status, setStatus] = useState<SmartTrimStatus>('idle');
  const [segments, setSegments] = useState<SilenceSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runDetection = useCallback(
    async (file: File, noiseDb = -30, minDuration = 0.5) => {
      setStatus('detecting');
      setError(null);
      try {
        const detected = await detectSilence(file, noiseDb, minDuration);
        setSegments(detected);
        setStatus('done');
      } catch (err) {
        console.error('[SmartTrim] Detection failed:', err);
        setError(err instanceof Error ? err.message : 'Detection failed');
        setStatus('error');
      }
    },
    []
  );

  const toggleSegment = useCallback((id: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  }, []);

  const selectAll = useCallback(() => {
    setSegments((prev) => prev.map((s) => ({ ...s, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setSegments((prev) => prev.map((s) => ({ ...s, selected: false })));
  }, []);

  /**
   * Computes the ranges of video to KEEP (inverting the selected silence segments).
   * Returns an array of {start, end} ranges that should be concatenated.
   */
  const applyTrim = useCallback(() => {
    const selectedSegments = segments
      .filter((s) => s.selected)
      .sort((a, b) => a.start - b.start);

    const keepRanges: Array<{ start: number; end: number }> = [];
    let cursor = 0;

    for (const seg of selectedSegments) {
      if (cursor < seg.start) {
        keepRanges.push({ start: cursor, end: seg.start });
      }
      cursor = seg.end;
    }

    if (cursor < videoDuration) {
      keepRanges.push({ start: cursor, end: videoDuration });
    }

    return { keepRanges };
  }, [segments, videoDuration]);

  const reset = useCallback(() => {
    setStatus('idle');
    setSegments([]);
    setError(null);
  }, []);

  return {
    status,
    segments,
    runDetection,
    toggleSegment,
    selectAll,
    deselectAll,
    applyTrim,
    reset,
    error,
  };
}