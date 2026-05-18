"use client";

import { useRef, useState } from "react";
import { Film, FolderOpen, UploadCloud } from "lucide-react";
import { useRef, useState, useEffect} from "react";
import { Film, FolderOpen } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import uploadAnim from "@/lib/lottie/upload.json";
import { cn, formatBytes } from "@/lib/utils";
import { MAX_FILE_SIZE, WARNING_FILE_SIZE } from "@/lib/types";

interface Props {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
  fileError: string;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function FileUpload({
  onFileSelect,
  currentFile,
  fileError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        inputRef.current?.click();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const openPicker = () => inputRef.current?.click();

  const handleFile = (file: File) => {
    setError("");
    setWarning("");
    setDuration(null);

    if (!file.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${formatBytes(file.size)}). Maximum allowed size is 2GB.`);
      return;
    }

    if (file.size > WARNING_FILE_SIZE) {
      const estimatedMinutes = Math.max(1, Math.round(file.size / (100 * 1024 * 1024)));
      setWarning(
        `Large file detected (${formatBytes(
          file.size
        )}). This may run slowly on lower-powered devices.`
        )}). Processing may take ~${estimatedMinutes} minutes and affect performance on low-memory devices.`
      );
    }

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

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {warning && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {warning}
        </p>
      )}

      {currentFile ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:flex-row sm:items-center">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--film-50)] text-[var(--film-600)]">
            <Film size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text)]">
              {currentFile.name}
            </p>

            <p className="mt-1 text-xs text-[var(--muted)]">
              {formatBytes(currentFile.size)}
              {duration !== null
                ? ` • ${formatDuration(duration)}`
                : " • Reading metadata..."}
            </p>
          </div>

          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <FolderOpen size={16} />
            Change
          </button>
        </div>
      ) : (
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
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          className={cn(
            "group flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-6 py-10 text-center",
            "transition-all duration-200",
            dragging
              ? "scale-[1.01] border-[var(--accent)] bg-[var(--film-50)]"
              : "border-[var(--border)] bg-[var(--surface-soft)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--film-50)]"
          )}
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--surface)] text-[var(--accent)] shadow-sm ring-1 ring-[var(--border)] group-hover:scale-105">
            <UploadCloud size={30} />
          </div>

          <div>
            <p className="text-lg font-semibold text-[var(--text)]">
              {dragging ? "Drop your video here" : "Drag a video here"}
            </p>

            <p className="mt-2 text-sm text-[var(--muted)]">
              or click to browse from your device
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--muted)]">
            {["MP4", "MOV", "AVI", "WebM"].map((format) => (
              <span
                key={format}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1"
              >
                {format}
              </span>
            ))}
          </div>

          <p className="text-xs text-[var(--muted)]">Maximum file size: 2GB</p>
        </div>
  const FileInfo = () => (
    <div className="flex items-center gap-3 px-4 py-3 bg-film-50 border border-film-200 rounded-lg">
      <Film size={18} className="text-film-600 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-[var(--text)] truncate">
            {currentFile?.name}
          </p>
          {currentFile && (
            <span className="px-2 py-0.5 bg-gray-700 text-white font-bold tracking-wider rounded text-[10px] uppercase">
              {currentFile.name.includes('.') ? currentFile.name.split('.').pop() : 'VIDEO'}
            </span>
          )}
        </div>

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

      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-heading font-medium text-[var(--muted)]">
      <FolderOpen size={14} />
        MP4 / MOV / AVI / WebM
      </div>
      <p className="text-xs text-gray-500">
        Supports: MP4, MOV, AVI, MKV, WebM, and most video formats
      </p>
      {fileError && (
        <p className="text-xs text-red-500 mt-2 font-medium">
          {fileError}
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
      <div className="w-20 h-20 opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-200">
        <LottiePlayer animationData={uploadAnim} loop autoplay />
      </div>

      <div className="text-center">
        <p className="font-heading font-semibold text-[var(--text)] text-base">
          {dragging
            ? "Release to upload"
            : "Drag & Drop your video in here"}
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

      <p className="text-xs text-gray-500 text-center">
        Supports: MP4, MOV, AVI, MKV, WebM, and most video formats up to 2GB
      </p>

      {fileError && (
        <p className="text-sm text-red-500 text-center">{fileError}</p>
      )}

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
