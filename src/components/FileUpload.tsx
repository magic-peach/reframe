"use client";

import { useRef, useState } from "react";
import { Film, FolderOpen } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import uploadAnim from "@/lib/lottie/upload.json";
import { cn, formatBytes } from "@/lib/utils";
import { MAX_FILE_SIZE, WARNING_FILE_SIZE } from "@/lib/types";

interface Props {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

export default function FileUpload({ onFileSelect, currentFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const handleFile = (file: File) => {
    setError("");
    setWarning("");
    setDuration(null);

    // Validate type
    if (!file.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      return;
    }

    // Hard limit
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File too large (${formatBytes(
          file.size
        )}). Maximum allowed size is 2GB.`
      );
      return;
    }

    // Soft warning
    if (file.size > WARNING_FILE_SIZE) {
      setWarning(
        `Large file detected (${formatBytes(
          file.size
        )}). This may cause slow performance on low-end devices.`
      );
    }

    // Extract metadata safely
    const video = document.createElement("video");
    video.preload = "metadata";

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      setDuration(video.duration);
    };

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const FileInfo = () => (
    <div className="flex items-center gap-3 px-4 py-3 bg-film-50 border border-film-200 rounded-lg">
      <Film size={18} className="text-film-600 shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text)] truncate">
          {currentFile?.name}
        </p>

        <p className="text-xs text-[var(--muted)]">
          {formatBytes(currentFile?.size ?? 0)}
          {duration !== null
            ? ` • ${formatDuration(duration)}`
            : " • Loading metadata..."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-semibold text-film-600 hover:text-film-700 uppercase tracking-wide"
      >
        Change
        <span className="text-[var(--muted)] ml-1">(Ctrl+O)</span>
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

  const DropZone = () => (
    <div
      role="button"
      aria-label="Upload video file"
      tabIndex={0}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          inputRef.current?.click();
        }
      }}
      className={cn(
        "group flex flex-col items-center justify-center gap-4 py-12 px-6",
        "border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
        dragging
          ? "border-film-500 bg-film-50 scale-[1.01]"
          : "border-[var(--border)] bg-[var(--bg)] hover:border-film-400 hover:bg-film-50/40"
      )}
    >
      <div className="w-20 h-20 opacity-80 group-hover:opacity-100 transition">
        <LottiePlayer animationData={uploadAnim} loop autoplay />
      </div>

      <div className="text-center">
        <p className="font-semibold text-[var(--text)]">
          {dragging ? "Release to upload" : "Drag & Drop your video here"}
        </p>

        <p className="text-sm text-[var(--muted)] mt-1">
          or click to browse
        </p>

        <p className="text-xs text-[var(--muted)] mt-2">
          Ctrl+O / Cmd+O
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--muted)]">
        <FolderOpen size={14} />
        MP4 / MOV / AVI / WebM
      </div>

      <p className="text-xs text-gray-500 text-center">
        Supports most common video formats up to 2GB
      </p>

      {/* Show file size preview if file exists */}
      {currentFile && (
        <p className="text-xs text-[var(--muted)] mt-2">
          Selected: {formatBytes(currentFile.size)}
        </p>
      )}

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

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {warning && <p className="text-sm text-yellow-500">{warning}</p>}

      {currentFile ? <FileInfo /> : <DropZone />}
    </div>
  );
}