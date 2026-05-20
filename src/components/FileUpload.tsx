"use client";

import { useRef, useState, useEffect} from "react";
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

  const handleFile = (file: File) => {
    setError("");
    setWarning("");

    // Validate type
    if (!file.type.startsWith("video/")) {
      setError("Only video files are allowed.");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError("File size exceeds 500MB limit. Please select a smaller video.");
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
      const estimatedMinutes = Math.max(1, Math.round(file.size / (100 * 1024 * 1024)));
      setWarning(
        `Large file detected (${formatBytes(
          file.size
        )}). Processing may take ~${estimatedMinutes} minutes and affect performance on low-memory devices.`
      );
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

 const FileInfo = () => (
  <div className="px-4 py-3 bg-film-50 border border-film-200 rounded-lg">
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">

      <div className="flex items-start gap-3 flex-1 min-w-0">

        <div className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--border)] shrink-0">
          <Film size={16} className="text-film-600" />
        </div>

        <Film size={18} className="lg:hidden text-film-600 shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-film-700 truncate max-w-[320px] xl:max-w-[420px]">
              {currentFile?.name}
            </p>
            {currentFile && (
              <span className="px-2 py-0.5 bg-gray-700 text-white font-bold tracking-wider rounded text-[10px] uppercase shrink-0">
                {currentFile.name.includes(".")
                  ? currentFile.name.split(".").pop()
                  : "VIDEO"}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
            <p>{formatBytes(currentFile?.size ?? 0)}</p>

            <p>
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
        className="text-xs font-semibold text-film-600 hover:text-film-700 uppercase tracking-wide"
      >
        Change
        <span className="text-[var(--muted)] ml-1">(Ctrl+O)</span>
      </button>


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

    <p className="text-xs text-gray-500 mt-3 break-words">
      Supports: MP4, MOV, AVI, MKV, WebM, and most video formats
    </p>

    {fileError && (
      <p className="text-xs text-red-500 mt-2 font-medium">{fileError}</p>
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
        "border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden",
        dragging
          ? "border-film-500 bg-film-50/50 scale-[1.02] shadow-[0_0_40px_-10px_rgba(230,57,70,0.4)] ring-4 ring-film-500/30"
          : "border-[var(--border)] bg-[var(--bg)] hover:border-film-400 hover:bg-film-50/40"
      )}
    >
      {/* Premium Light Beam Shimmer Effect */}
      {dragging && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-film-500/20 to-transparent pointer-events-none" />
      )}
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
