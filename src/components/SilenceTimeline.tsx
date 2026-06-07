'use client';

import React from 'react';
import type { SilenceSegment } from '@/lib/types';

interface SilenceTimelineProps {
  segments: SilenceSegment[];
  duration: number;
  onToggleSegment: (id: string) => void;
}

export function SilenceTimeline({
  segments,
  duration,
  onToggleSegment,
}: SilenceTimelineProps) {
  if (!segments.length || !duration) return null;

  return (
    <div className="relative w-full h-2 bg-white/5 rounded-full overflow-visible mt-1">
      {segments.map((seg) => {
        const left = (seg.start / duration) * 100;
        const width = ((seg.end - seg.start) / duration) * 100;
        return (
          <button
            key={seg.id}
            title={`Silence: ${seg.start.toFixed(2)}s – ${seg.end.toFixed(2)}s (${seg.duration.toFixed(2)}s)\nClick to toggle`}
            onClick={() => onToggleSegment(seg.id)}
            style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
            className={`absolute top-0 h-full rounded-sm transition-colors cursor-pointer ${
              seg.selected
                ? 'bg-violet-500/70 hover:bg-violet-400/80'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          />
        );
      })}
    </div>
  );
}