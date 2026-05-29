'use client';

import { useState } from 'react';
import { Crosshair, Loader2, Info } from 'lucide-react';
import { analyzeBestCropRegion } from '@/lib/analyzeFrame';
import type { AutoReframeSettings } from '@/lib/types';

interface Props {
  videoFile: File | null;
  targetWidth: number;
  targetHeight: number;
  autoReframe: AutoReframeSettings | undefined;
  onChange: (settings: AutoReframeSettings | undefined) => void;
}

export function AutoReframeControl({
  videoFile,
  targetWidth,
  targetHeight,
  autoReframe,
  onChange,
}: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const isEnabled = autoReframe?.enabled ?? false;

  const handleToggle = async () => {
    if (!videoFile) return;

    if (isEnabled) {
      onChange(undefined);
      return;
    }

    setAnalyzing(true);
    try {
      const aspect = targetWidth / targetHeight;
      const { cropX, cropY } = await analyzeBestCropRegion(videoFile, aspect);
      onChange({ enabled: true, cropX, cropY });
    } catch {
      onChange({ enabled: true, cropX: 0.5, cropY: 0.5 });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-purple-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-zinc-100">Smart Auto Reframe</p>
            <p className="text-xs text-zinc-400">
              Finds the best crop position for your subject
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={!videoFile || analyzing}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors
            ${isEnabled
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }
            disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {analyzing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing…
            </>
          ) : isEnabled ? (
            'On'
          ) : (
            'Off'
          )}
        </button>
      </div>

      {isEnabled && autoReframe && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <Info className="h-3 w-3 shrink-0" />
          <span>
            Crop origin: {Math.round(autoReframe.cropX * 100)}%,{' '}
            {Math.round(autoReframe.cropY * 100)}%
          </span>
        </div>
      )}

      {!videoFile && (
        <p className="mt-2 text-xs text-zinc-500">Upload a video to enable smart reframe</p>
      )}
    </div>
  );
}