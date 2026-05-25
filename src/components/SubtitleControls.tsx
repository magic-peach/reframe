"use client";

import { EditRecipe } from "@/lib/types";
import { SubtitleItem } from "@/lib/subtitles";
import { Upload, Trash2, Sliders, Type, Palette, Layout, Search, Play } from "lucide-react";
import { useMemo, useState, useRef } from "react";
import { getPresetById } from "@/lib/presets";

interface SubtitleControlsProps {
  recipe: EditRecipe;
  onChange: (patch: Partial<EditRecipe>) => void;
  subtitleFile: File | null;
  parsedSubtitles: SubtitleItem[] | null;
  onSubtitleSelect: (file: File) => void;
  onClearSubtitles: () => void;
  onSeek: (time: number) => void;
}

const FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Outfit", label: "Outfit" },
  { value: "Roboto", label: "Roboto" },
  { value: "Arial", label: "Arial (Standard)" },
  { value: "Courier New", label: "Courier New" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "system-ui", label: "System UI" },
];

const PRESET_COLORS = [
  { hex: "#ffffff", label: "White" },
  { hex: "#ffff00", label: "Yellow" },
  { hex: "#00ffff", label: "Cyan" },
  { hex: "#00ff00", label: "Green" },
  { hex: "#ff00ff", label: "Magenta" },
  { hex: "#000000", label: "Black" },
];

const STYLES = [
  { value: "none", label: "Plain Text" },
  { value: "outline", label: "Black Outline" },
  { value: "box", label: "Semi-Transparent Box" },
  { value: "shadow", label: "Soft Shadow" },
];

export default function SubtitleControls({
  recipe,
  onChange,
  subtitleFile,
  parsedSubtitles,
  onSubtitleSelect,
  onClearSubtitles,
  onSeek,
}: SubtitleControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSubtitleSelect(file);
    }
  };

  const filteredSubtitles = useMemo(() => {
    if (!parsedSubtitles) return [];
    if (!searchQuery.trim()) return parsedSubtitles;
    const query = searchQuery.toLowerCase();
    return parsedSubtitles.filter((sub) => sub.text.toLowerCase().includes(query));
  }, [parsedSubtitles, searchQuery]);

  const formatTimestamp = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  };

  return (
    <div className="w-full space-y-5">
      {/* File Upload / Clear */}
      <div className="space-y-3">
        {!subtitleFile ? (
          <div>
            <input
              type="file"
              accept=".srt"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              id="subtitles-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)] hover:border-film-500 transition-all duration-200 cursor-pointer group"
            >
              <Upload className="w-6 h-6 text-[var(--muted)] group-hover:text-film-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-[var(--text)]">Upload SRT Subtitles</span>
              <span className="text-xs text-[var(--muted)]">Drag and drop or browse files</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text)] truncate">
                {subtitleFile.name}
              </p>
              <p className="text-[10px] text-[var(--muted)]">
                {parsedSubtitles?.length ?? 0} subtitle segments loaded
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSubtitles}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0 cursor-pointer"
              aria-label="Remove subtitle file"
              title="Remove subtitle file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {subtitleFile && (
        <div className="space-y-5 pt-3 border-t border-[var(--border)] animate-fade-in">
          {/* Typography Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-film-500" />
              Typography
            </h4>

            {/* Font Family */}
            <div className="space-y-1">
              <label htmlFor="subtitle-font" className="text-xs text-[var(--muted)] font-medium">
                Font Family
              </label>
              <select
                id="subtitle-font"
                value={recipe.subtitleFont}
                onChange={(e) => onChange({ subtitleFont: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-film-500"
              >
                {FONTS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="subtitle-size" className="text-xs text-[var(--muted)] font-medium">
                  Font Size
                </label>
                <span className="text-xs font-mono font-semibold text-film-400">
                  {recipe.subtitleSize}px
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="subtitle-size"
                  type="range"
                  min="12"
                  max="72"
                  step="2"
                  value={recipe.subtitleSize}
                  onChange={(e) => onChange({ subtitleSize: Number(e.target.value) })}
                  className="flex-1 accent-film-600 cursor-pointer"
                />
                <div className="flex gap-1 shrink-0">
                  {(["Small", "Medium", "Large"] as const).map((label, idx) => {
                    const size = idx === 0 ? 24 : idx === 1 ? 36 : 48;
                    const isActive = recipe.subtitleSize === size;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => onChange({ subtitleSize: size })}
                        className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                          isActive
                            ? "bg-film-600 text-white"
                            : "bg-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)]"
                        }`}
                      >
                        {label.substring(0, 1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Color Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-film-500" />
              Colors
            </h4>

            {/* Text Color */}
            <div className="space-y-1.5">
              <label htmlFor="subtitle-color" className="text-xs text-[var(--muted)] font-medium">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="subtitle-color"
                  type="color"
                  value={recipe.subtitleColor}
                  onChange={(e) => onChange({ subtitleColor: e.target.value })}
                  className="w-9 h-7 rounded border border-[var(--border)] cursor-pointer shrink-0 bg-transparent"
                />
                <input
                  type="text"
                  value={recipe.subtitleColor}
                  onChange={(e) => onChange({ subtitleColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1 px-2 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-film-500"
                  aria-label="Subtitle Hex color input"
                />
              </div>

              {/* Curated color buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => onChange({ subtitleColor: color.hex })}
                    className="w-5 h-5 rounded-full border border-[var(--border)] relative hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                    aria-label={`Select preset color ${color.label}`}
                  >
                    {recipe.subtitleColor.toLowerCase() === color.hex.toLowerCase() && (
                      <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-film-500 shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Style & Box Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-film-500" />
              Background & Readability
            </h4>

            {/* Background type select */}
            <div className="space-y-1">
              <label htmlFor="subtitle-bg-type" className="text-xs text-[var(--muted)] font-medium">
                Background Type
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STYLES.map((style) => {
                  const isActive = recipe.subtitleBgType === style.value;
                  return (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => onChange({ subtitleBgType: style.value as any })}
                      className={`px-2 py-1.5 text-left text-xs rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? "border-film-500 bg-film-600/10 text-film-400"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border)]"
                      }`}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background / outline color */}
            {recipe.subtitleBgType !== "none" && (
              <div className="space-y-1.5 pt-1.5 border-t border-[var(--border)]/40 animate-fade-in">
                <label htmlFor="subtitle-bg-color" className="text-xs text-[var(--muted)] font-medium">
                  {recipe.subtitleBgType === "outline" ? "Outline Color" : "Background Box/Shadow Color"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="subtitle-bg-color"
                    type="color"
                    value={recipe.subtitleBgColor}
                    onChange={(e) => onChange({ subtitleBgColor: e.target.value })}
                    className="w-9 h-7 rounded border border-[var(--border)] cursor-pointer shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={recipe.subtitleBgColor}
                    onChange={(e) => onChange({ subtitleBgColor: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 px-2 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-film-500"
                    aria-label="Subtitle Background Hex color input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subtitles Navigation list */}
          <div className="space-y-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-film-500" />
                Segments
              </h4>
              <span className="text-[10px] text-[var(--muted)] font-mono">
                {filteredSubtitles.length} of {parsedSubtitles?.length ?? 0}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-[var(--muted)]" />
              </span>
              <input
                type="text"
                placeholder="Search captions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-film-500"
              />
            </div>

            {/* Subtitle segments list */}
            {filteredSubtitles.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] p-1 bg-[var(--bg)] scrollbar-thin">
                {filteredSubtitles.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSeek(sub.startTime)}
                    className="w-full text-left p-2 rounded hover:bg-[var(--border)] transition-colors duration-150 flex flex-col gap-0.5 border border-transparent hover:border-[var(--border)] cursor-pointer"
                    title={`Seek video to ${formatTimestamp(sub.startTime)}`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-film-500 font-semibold uppercase">
                      <span>{formatTimestamp(sub.startTime)}</span>
                      <span>--&gt; {formatTimestamp(sub.endTime)}</span>
                    </div>
                    <p className="text-xs text-[var(--text)] font-medium leading-normal line-clamp-2">
                      {sub.text}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-[var(--border)] rounded-lg text-xs text-[var(--muted)] bg-[var(--bg)]">
                No matching captions found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
