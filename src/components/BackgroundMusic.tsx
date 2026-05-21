"use client";

import React from "react";

interface Props {
  musicFile: File | null;
  setMusicFile: (file: File | null) => void;

  musicVolume: number;
  setMusicVolume: (v: number) => void;

  originalAudioVolume: number;
  setOriginalAudioVolume: (v: number) => void;

  loopMusic: boolean;
  setLoopMusic: (v: boolean) => void;

  muteOriginalAudio: boolean;
  setMuteOriginalAudio: (v: boolean) => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
      {children}
    </label>
  );
}

export default function BackgroundMusic({
  musicFile,
  setMusicFile,
  musicVolume,
  setMusicVolume,
  originalAudioVolume,
  setOriginalAudioVolume,
  loopMusic,
  setLoopMusic,
  muteOriginalAudio,
  setMuteOriginalAudio,
}: Props) {
  return (
    <div className="space-y-5">

      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Background Music</h3>
        {musicFile && (
          <span className="text-xs text-green-600">
            ✓ Selected
          </span>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>Upload Music</Label>

        <input
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          className="w-full text-xs border border-[var(--border)] rounded-lg p-2 bg-[var(--surface)]"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setMusicFile(file);
          }}
        />

        {musicFile && (
          <p className="text-xs text-[var(--muted)] truncate">
            {musicFile.name}
          </p>
        )}
      </div>

      {/* Music Volume */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Music Volume</Label>
          <span className="text-xs">{musicVolume}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={musicVolume}
          onChange={(e) => setMusicVolume(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Original Audio Volume */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Original Audio</Label>
          <span className="text-xs">{originalAudioVolume}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={originalAudioVolume}
          onChange={(e) =>
            setOriginalAudioVolume(Number(e.target.value))
          }
          className="w-full"
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 pt-2">

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Mute Original Audio</span>
          <input
            type="checkbox"
            checked={muteOriginalAudio}
            onChange={(e) =>
              setMuteOriginalAudio(e.target.checked)
            }
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Loop Music</span>
          <input
            type="checkbox"
            checked={loopMusic}
            onChange={(e) => setLoopMusic(e.target.checked)}
          />
        </label>

      </div>
    </div>
  );
}