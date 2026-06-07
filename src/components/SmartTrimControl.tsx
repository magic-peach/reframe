'use client';

import React, { useState } from 'react';
import { Scissors, Loader2, AlertCircle, CheckCheck, Square } from 'lucide-react';
import type { SilenceSegment, SmartTrimStatus } from '@/lib/types';

interface SmartTrimControlProps {
  status: SmartTrimStatus;
  segments: SilenceSegment[];
  onDetect: (noiseDb: number, minDuration: number) => void;
  onToggleSegment: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApply: () => void;
  onReset: () => void;
  error: string | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

export function SmartTrimControl({
  status,
  segments,
  onDetect,
  onToggleSegment,
  onSelectAll,
  onDeselectAll,
  onApply,
  onReset,
  error,
}: SmartTrimControlProps) {
  const [noiseDb, setNoiseDb] = useState(-30);
  const [minDuration, setMinDuration] = useState(0.5);

  const selectedCount = segments.filter((s) => s.selected).length;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Scissors className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Smart Trim</h3>
        <span className="ml-auto text-xs text-white/40">Privacy-safe · runs locally</span>
      </div>

      {/* Settings */}
      {status === 'idle' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">
              Silence threshold: <span className="text-white">{noiseDb} dB</span>
            </label>
            <input
              type="range"
              min={-60}
              max={-10}
              step={1}
              value={noiseDb}
              onChange={(e) => setNoiseDb(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-white/30">
              <span>-60 dB (very quiet)</span>
              <span>-10 dB (louder)</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/60">
              Min silence length: <span className="text-white">{minDuration}s</span>
            </label>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.1}
              value={minDuration}
              onChange={(e) => setMinDuration(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          <button
            onClick={() => onDetect(noiseDb, minDuration)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 transition-colors"
          >
            <Scissors className="w-4 h-4" />
            Detect Silence
          </button>
        </div>
      )}

      {/* Loading */}
      {status === 'detecting' && (
        <div className="flex items-center justify-center gap-2 py-4 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing audio...
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error ?? 'Detection failed'}
          </div>
          <button
            onClick={onReset}
            className="text-xs text-white/40 underline hover:text-white/60"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {status === 'done' && (
        <div className="space-y-3">
          {segments.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-2">
              No silence detected. Try adjusting the threshold.
            </p>
          ) : (
            <>
              {/* Bulk controls */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">
                  {segments.length} segment{segments.length !== 1 ? 's' : ''} found
                  {selectedCount > 0 && ` · ${selectedCount} selected`}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={onSelectAll}
                    title="Select all"
                    className="text-[10px] text-white/40 hover:text-white flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> All
                  </button>
                  <button
                    onClick={onDeselectAll}
                    title="Deselect all"
                    className="text-[10px] text-white/40 hover:text-white flex items-center gap-1"
                  >
                    <Square className="w-3 h-3" /> None
                  </button>
                </div>
              </div>

              {/* Segment list */}
              <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {segments.map((seg) => (
                  <li key={seg.id}>
                    <button
                      onClick={() => onToggleSegment(seg.id)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                        seg.selected
                          ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                          : 'bg-white/5 border border-transparent text-white/40'
                      }`}
                    >
                      <span>
                        {formatTime(seg.start)} → {formatTime(seg.end)}
                      </span>
                      <span className="text-white/40">{seg.duration.toFixed(2)}s</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onApply}
              disabled={selectedCount === 0}
              className="flex-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 transition-colors"
            >
              Apply Trim ({selectedCount})
            </button>
            <button
              onClick={onReset}
              className="rounded-lg border border-white/10 hover:bg-white/10 text-white/60 text-sm px-3 py-2 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}