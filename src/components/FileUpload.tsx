"use client";

import { useEffect, useRef, useState } from "react";
import { Film, FolderOpen } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import uploadAnim from "@/lib/lottie/upload.json";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/ffmpeg";

interface Props {
  onFileSelect: (file: File | null) => void;
  currentFile: File | null;
}



export default function FileUpload({ onFileSelect, currentFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        inputRef.current?.click();
      }
    };

    document.addEventListener("keydown", handleOpenShortcut);
    return () => document.removeEventListener("keydown", handleOpenShortcut);
  }, []);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("video/")) return;

    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError(`This file is ${formatBytes(file.size)}. Maximum allowed size is 2.0 GB.`);
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (currentFile) {
    const isLargeFile = currentFile.size > 1024 * 1024 * 1024;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 px-4 py-3 bg-film-50 border border-film-200 rounded-lg">
          <Film size={18} className="text-film-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium font-heading truncate text-[var(--text)]">
              {currentFile.name}
            </p>
            <p className="text-xs text-[var(--muted)]">{formatBytes(currentFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-heading font-semibold text-film-600 hover:text-film-700 uppercase tracking-wide shrink-0 transition-colors cursor-pointer"
          >
            Change <span className="text-[var(--muted)] ml-1">(Ctrl+O / Cmd+O)</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
        {isLargeFile && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
            <span className="text-amber-500">⚠️</span>
            <p>
              This file is {formatBytes(currentFile.size)} — processing may be slow or fail on some devices.
            </p>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
            <span className="text-red-500">❌</span>
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group flex flex-col items-center justify-center gap-4 py-12 px-6",
        "border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
        dragging
          ? "border-film-500 bg-film-50 scale-[1.01]"
          : "border-[var(--border)] bg-[var(--bg)] hover:border-film-400 hover:bg-film-50/40"
      )}
    >
      <div className="w-20 h-20 opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-200">
        <LottiePlayer animationData={uploadAnim} loop autoplay />
      </div>

      <div className="text-center">
        <p className="font-heading font-semibold text-[var(--text)] text-base">
          Drop a video file here
        </p>
        <p className="text-sm text-[var(--muted)] mt-1">
          or click to browse
        </p>
        <p className="text-xs text-[var(--muted)] mt-2 font-heading">
          Ctrl+O / Cmd+O
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-heading font-medium text-[var(--muted)]">
            <FolderOpen size={14} />
            MP4 / MOV / AVI / WebM
          </div>
          <p className="text-xs text-[var(--muted)]">Max file size: 2 GB</p>
        </div>
        
        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-red-500">❌</span>
            {error}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
