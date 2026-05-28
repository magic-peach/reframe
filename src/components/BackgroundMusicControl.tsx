"use client";

import { useRef, useState } from "react";
import {
  Music,
  Trash2,
  Upload,
  Volume2,
  Repeat,
  AlertCircle,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

interface Props {
  musicFile: File | null;
  setMusicFile: (file: File | null) => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  originalAudioVolume: number;
  setOriginalAudioVolume: (v: number) => void;
  loopMusic: boolean;
  setLoopMusic: (v: boolean) => void;
}

export default function BackgroundMusicControl({
  musicFile,
  setMusicFile,
  musicVolume,
  setMusicVolume,
  originalAudioVolume,
  setOriginalAudioVolume,
  loopMusic,
  setLoopMusic,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio file (e.g., MP3, WAV, AAC).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setMusicFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = () => {
    setMusicFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* File Upload / Info Area */}
      {!musicFile ? (
        <div className="space-y-2">
          <label
            className={cn(
              "flex flex-col items-center justify-center p-4 border border-dashed rounded-xl cursor-pointer transition-colors duration-200",
              "hover:bg-[var(--accent-muted)] hover:border-film-400",
              error ? "border-[var(--error)]" : "border-[var(--border)]",
            )}
          >
            <Upload size={18} className="text-[var(--muted)] mb-2" />
            <span className="text-sm font-heading font-semibold text-[var(--text)]">
              Upload Background Music
            </span>
            <span className="text-xs text-[var(--muted)] mt-1">
              MP3, WAV, AAC
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          {error && (
            <p className="text-xs text-[var(--error)] flex items-center gap-1.5 animate-fade-in">
              <AlertCircle size={12} />
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] shadow-sm animate-fade-in">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-film-100 flex items-center justify-center shrink-0">
              <Music size={14} className="text-film-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-heading font-semibold truncate text-[var(--text)]">
                {musicFile.name}
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                {formatBytes(musicFile.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-2 text-[var(--muted)] hover:bg-[var(--error-bg)] hover:text-[var(--error)] rounded-lg transition-colors shrink-0 ml-2"
            aria-label="Remove background music"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Audio Mix Controls */}
      {musicFile && (
        <div className="space-y-4 pt-3 border-t border-[var(--border)] animate-fade-in">
          {/* Loop Toggle */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="loop-music-toggle"
              className="text-sm font-heading font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2"
            >
              <Repeat size={12} />
              Loop Music
            </label>
            <input
              id="loop-music-toggle"
              type="checkbox"
              checked={loopMusic}
              onChange={(e) => setLoopMusic(e.target.checked)}
              className="accent-film-600 cursor-pointer"
            />
          </div>
          <p className="text-[10px] text-[var(--muted)] -mt-3">
            Repeat the audio track if it's shorter than the video.
          </p>

          {/* Music Volume */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="music-volume-slider"
                className="font-semibold text-[var(--text)]"
              >
                Music Volume
              </label>
              <span className="text-[var(--muted)] font-mono">
                {musicVolume}%
              </span>
            </div>
            <input
              id="music-volume-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              aria-label="Adjust background music volume"
              className="w-full accent-film-600 cursor-pointer"
            />
          </div>

          {/* Original Video Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="original-volume-slider"
                className="font-semibold text-[var(--text)]"
              >
                Original Video Audio
              </label>
              <span className="text-[var(--muted)] font-mono">
                {originalAudioVolume}%
              </span>
            </div>
            <input
              id="original-volume-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={originalAudioVolume}
              onChange={(e) => setOriginalAudioVolume(Number(e.target.value))}
              aria-label="Adjust original video volume"
              className="w-full accent-film-600 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
