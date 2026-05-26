"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Film, FolderOpen } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import uploadAnim from "@/lib/lottie/upload.json";
import { cn, formatBytes, formatDuration } from "@/lib/utils";
import { MAX_FILE_SIZE, WARNING_FILE_SIZE } from "@/lib/types";

interface Props {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
  fileError: string;
  duration: number;
}

export default function FileUpload({
  onFileSelect,
  currentFile,
  fileError,
  duration,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [pageDragging, setPageDragging] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const dragCounterRef = useRef(0);

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

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) setPageDragging(true);
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) setPageDragging(false);
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setPageDragging(false);

      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    };

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);

    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = useCallback((file: File) => {
    setError("");
    setWarning("");

    if (!file.type.startsWith("video/")) {
      setError("Please drop a valid video file (MP4, MOV, AVI, WebM, etc.)");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError("File size exceeds 500MB limit. Please select a smaller video.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File too large (${formatBytes(file.size)}). Maximum allowed size is 2GB.`
      );
      return;
    }

    if (file.size > WARNING_FILE_SIZE) {
      const estimatedMinutes = Math.max(
        1,
        Math.round(file.size / (100 * 1024 * 1024))
      );
      setWarning(
        `Large file detected (${formatBytes(file.size)}). Processing may take ~${estimatedMinutes} minutes.`
      );
    }

    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const FileInfo = () => (
    <div className="rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-4 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 lg:flex">
            <Film size={16} className="text-cyan-200" />
          </div>
          <Film size={18} className="mt-0.5 shrink-0 text-cyan-200 lg:hidden" />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex flex-wrap items-center gap-2">
              <p className="max-w-[320px] truncate text-sm font-semibold text-white xl:max-w-[420px]">
                {currentFile?.name}
              </p>
              {currentFile && (
                <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-100">
                  {currentFile.name.includes(".")
                    ? currentFile.name.split(".").pop()
                    : "VIDEO"}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
              <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {formatBytes(currentFile?.size ?? 0)}
              </p>
              <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {duration > 0
                  ? `Duration: ${formatDuration(duration)}`
                  : "Loading duration..."}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-950 shadow-lg transition hover:scale-105 hover:bg-cyan-200"
        >
          Change Video
        </button>
      </div>

      <p className="mt-3 break-words text-xs text-slate-400">
        Supports: MP4, MOV, AVI, MKV, WebM, and most video formats
      </p>

      {fileError && (
        <p className="mt-2 text-xs font-medium text-red-300">{fileError}</p>
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
      id="upload-zone"
      role="button"
      tabIndex={0}
      aria-label="Video upload area. Drag and drop a video file or press Enter to browse."
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
        "group relative flex min-h-[420px] cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-[2rem] px-6 py-14 text-center",
        "border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-black shadow-2xl backdrop-blur-xl",
        "transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.22),transparent_36%)]",
        dragging
          ? "scale-[1.02] border-cyan-300 shadow-[0_0_70px_rgba(34,211,238,0.28)] ring-4 ring-cyan-300/10"
          : "hover:border-cyan-300/60 hover:shadow-[0_0_55px_rgba(34,211,238,0.18)]"
      )}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />
      )}

      <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 opacity-90 shadow-[0_0_35px_rgba(34,211,238,0.22)] transition duration-200 group-hover:scale-105 group-hover:opacity-100">
        <LottiePlayer animationData={uploadAnim} loop autoplay />
      </div>

      <div className="relative z-10 text-center">
        <p className="font-heading text-3xl font-black text-white">
          {dragging ? "Release to Upload" : "Upload & Transform Your Video"}
        </p>
        <p className="mt-3 text-sm text-slate-300">
          Drag and drop a video here, or click to browse.
        </p>
        <p className="mt-3 font-heading text-xs uppercase tracking-[0.22em] text-slate-500">
          Ctrl+O / Cmd+O
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-heading font-semibold text-white backdrop-blur">
        <FolderOpen size={14} />
        MP4 / MOV / AVI / WebM
      </div>

      <p className="relative z-10 text-center text-xs text-slate-400">
        Supports: MP4, MOV, AVI, MKV, WebM, and most video formats
      </p>

      {fileError && (
        <p className="relative z-10 text-center text-sm text-red-300">
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

  return (
    <>
      {pageDragging && (
        <div
          aria-live="polite"
          aria-label="Drop your video file anywhere on the page"
          className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4",
            "border-4 border-dashed border-cyan-300 bg-black/60 backdrop-blur-sm",
            "transition-all duration-200 pointer-events-none"
          )}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute h-32 w-32 animate-ping rounded-full border-4 border-cyan-300/40" />
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-300/10">
              <Film size={40} className="text-cyan-200" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              Drop your video anywhere
            </p>
            <p className="mt-1 text-sm text-cyan-200">
              Release to start uploading
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
        {warning && (
          <p role="alert" className="text-sm text-amber-300">
            {warning}
          </p>
        )}
        {currentFile ? <FileInfo /> : <DropZone />}
      </div>
    </>
  );
}
