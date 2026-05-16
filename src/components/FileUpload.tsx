"use client";

import { useEffect, useRef, useState } from "react";
import { Film, FolderOpen } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import uploadAnim from "@/lib/lottie/upload.json";
import { cn } from "@/lib/utils";

interface Props {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
}

function fmt(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {  //1
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
  .toString()
  .padStart(2, "0")}`;
}


export default function FileUpload({ onFileSelect, currentFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

    const [duration, setDuration] = useState<number | null>(null); //2


  // const handleFile = (file: File) => {
  //   if (!file.type.startsWith("video/")) return;
  //   onFileSelect(file);
  // };

   const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) return;//3
  setDuration(null);
        const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setDuration(video.duration); //4
    };

    video.src = URL.createObjectURL(file);

    onFileSelect(file);
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  

  if (currentFile) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-film-50 border border-film-200 rounded-lg">
        <Film size={18} className="text-film-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium font-heading truncate text-[var(--text)]">
            {currentFile.name}
          </p>

          {/*<p className="text-xs text-[var(--muted)]">{fmt(currentFile.size)}</p>*/}
           <p className="text-xs text-[var(--muted)]">
            {fmt(currentFile.size)}{" "}
        {duration !== null ? `• ${formatDuration(duration)}` : "• Loading..."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-heading font-semibold text-film-600 hover:text-film-700 uppercase tracking-wide shrink-0 transition-colors cursor-pointer"
        >
          Change <span className="text-[var(--muted)]">(Ctrl+O / Cmd+O)</span>
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
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
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
          {dragging
            ? "Release to upload"
            : "Drag & Drop your video in here"
          
          }
        </p>
        <p className="text-sm text-[var(--muted)] mt-1">
          or click to browse
        </p>
        <p className="text-xs text-[var(--muted)] mt-2 font-heading">
          Ctrl+O / Cmd+O
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-heading font-medium text-[var(--muted)]">
      <FolderOpen size={14} />
        MP4 / MOV / AVI / WebM
      </div>
      <p className="text-xs text-gray-500">
        Supports: MP4, MOV, AVI, MKV, WebM, and most video formats
      </p>
      
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
