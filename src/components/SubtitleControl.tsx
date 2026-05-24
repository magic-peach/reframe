"use client";

import { useRef, useState } from "react";
import { SubtitleCue } from "@/lib/types";
import { Upload, Type, Palette, Sliders, Trash2, Eye } from "lucide-react";

interface SubtitleControlProps {
  subtitleFile: File | null;
  setSubtitleFile: (file: File | null) => void;
  subtitleCues: SubtitleCue[];
  subtitleFontFamily: string;
  setSubtitleFontFamily: (font: string) => void;
  subtitleFontSize: "small" | "medium" | "large";
  setSubtitleFontSize: (size: "small" | "medium" | "large") => void;
  subtitleTextColor: string;
  setSubtitleTextColor: (color: string) => void;
  subtitleBgOpacity: number;
  setSubtitleBgOpacity: (opacity: number) => void;
  subtitleHasShadow: boolean;
  setSubtitleHasShadow: (shadow: boolean) => void;
}

const FONTS = ["Inter", "Roboto", "Outfit", "Playfair Display"];
const COLORS = [
  { hex: "#ffffff", name: "White" },
  { hex: "#facc15", name: "Yellow" },
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#a3e635", name: "Lime" },
  { hex: "#ff007f", name: "Pink" },
];

export default function SubtitleControl({
  subtitleFile,
  setSubtitleFile,
  subtitleCues,
  subtitleFontFamily,
  setSubtitleFontFamily,
  subtitleFontSize,
  setSubtitleFontSize,
  subtitleTextColor,
  setSubtitleTextColor,
  subtitleBgOpacity,
  setSubtitleBgOpacity,
  subtitleHasShadow,
  setSubtitleHasShadow,
}: SubtitleControlProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".srt")) {
      setSubtitleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".srt")) {
      setSubtitleFile(file);
    }
  };

  const handleClear = () => {
    setSubtitleFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* File Upload Zone */}
      {!subtitleFile ? (
        <button
          type="button"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-film-500 bg-film-500/10 scale-[1.01]"
              : "border-[var(--border)] hover:border-film-500 hover:bg-[var(--border)]"
          }`}
        >
          <Upload className="text-[var(--muted)] mb-2 shrink-0" size={24} />
          <p className="text-xs font-bold font-heading uppercase tracking-widest text-[var(--text)]">
            Upload Subtitles (.srt)
          </p>
          <p className="text-[10px] text-[var(--muted)] mt-1">
            Drag & drop or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt"
            onChange={handleFileChange}
            className="hidden"
          />
        </button>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="min-w-0">
            <p className="text-xs font-bold truncate text-[var(--text)]">
              {subtitleFile.name}
            </p>
            <p className="text-[10px] text-film-500 font-semibold mt-0.5">
              {subtitleCues.length} caption cues detected
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
            title="Remove subtitles"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Customize Styling Options */}
      <div className={`space-y-4 ${!subtitleFile ? "opacity-40 pointer-events-none" : ""}`}>
        {/* Font Family */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
            <Type size={12} />
            Font Family
          </div>
          <select
            value={subtitleFontFamily}
            onChange={(e) => setSubtitleFontFamily(e.target.value)}
            disabled={!subtitleFile}
            className="w-full bg-[var(--surface)] text-sm rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--text)] focus:outline-none focus:border-film-500 transition-colors cursor-pointer"
          >
            {FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size Selection */}
        <div className="space-y-1.5">
          <div className="text-xs font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
            Font Size
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSubtitleFontSize(size)}
                disabled={!subtitleFile}
                className={`py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all duration-150 ${
                  subtitleFontSize === size
                    ? "bg-film-600 border-film-600 text-white shadow-sm"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--border)]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
            <Palette size={12} />
            Text Color
          </div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => setSubtitleTextColor(color.hex)}
                disabled={!subtitleFile}
                style={{ backgroundColor: color.hex }}
                className={`w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110 shadow-sm ${
                  subtitleTextColor === color.hex
                    ? "border-film-500 scale-105"
                    : "border-[var(--border)]"
                }`}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Sliders & Readability Settings */}
        <div className="space-y-3.5 pt-1">
          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
            <Sliders size={12} />
            Readability Options
          </div>

          {/* Background Box Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--text)]">
              <span>Background Opacity</span>
              <span className="font-mono text-[10px] bg-[var(--border)] px-1.5 py-0.5 rounded text-[var(--muted)]">
                {Math.round(subtitleBgOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.25"
              value={subtitleBgOpacity}
              onChange={(e) => setSubtitleBgOpacity(parseFloat(e.target.value))}
              disabled={!subtitleFile}
              className="w-full accent-film-600 cursor-pointer"
            />
          </div>

          {/* Text Shadow Toggle */}
          <label className="flex items-center justify-between text-xs text-[var(--text)] cursor-pointer py-0.5">
            <span>Text Shadow</span>
            <input
              type="checkbox"
              checked={subtitleHasShadow}
              onChange={(e) => setSubtitleHasShadow(e.target.checked)}
              disabled={!subtitleFile}
              className="w-4 h-4 rounded accent-film-600 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
