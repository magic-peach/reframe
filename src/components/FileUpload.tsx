"use client";

import { useRef, useState } from "react";
import { Upload, Film, X } from "lucide-react";

interface Props {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ onFileSelect, currentFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) return;
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
      <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
        <Film className="text-violet-500 shrink-0" size={20} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{currentFile.name}</p>
          <p className="text-xs text-gray-500">{formatSize(currentFile.size)}</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="text-xs text-violet-600 hover:underline shrink-0"
        >
          Change
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
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        flex flex-col items-center justify-center gap-3 p-10
        border-2 border-dashed rounded-2xl cursor-pointer transition-colors
        ${dragging
          ? "border-violet-400 bg-violet-50"
          : "border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/50"
        }
      `}
    >
      <div className="p-4 bg-white rounded-full shadow-sm">
        <Upload className="text-violet-500" size={28} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-700">Drop a video here</p>
        <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
      </div>
      <p className="text-xs text-gray-400">MP4, MOV, AVI, WebM and more</p>
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
