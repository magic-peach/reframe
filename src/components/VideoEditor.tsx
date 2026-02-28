"use client";

import { useVideoEditor } from "@/hooks/useVideoEditor";
import FileUpload from "./FileUpload";
import VideoPreview from "./VideoPreview";
import PresetSelector from "./PresetSelector";
import FramingControl from "./FramingControl";
import TrimControl from "./TrimControl";
import RotateControl from "./RotateControl";
import AudioSpeedControl from "./AudioSpeedControl";
import ExportSettings from "./ExportSettings";
import ExportOverlay from "./ExportOverlay";
import DownloadResult from "./DownloadResult";
import {
  Layers, Crop, Scissors, RotateCw, Volume2,
  SlidersHorizontal, Zap, AlertTriangle, Github
} from "lucide-react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ icon, title, children, delay = 0 }: SectionProps) {
  return (
    <div
      className="space-y-3 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-film-500 opacity-80">{icon}</span>
        <h3 className="text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </h3>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      {children}
    </div>
  );
}

export default function VideoEditor() {
  const {
    file, duration, recipe, status, progress,
    result, error, updateRecipe,
    handleFileSelect, handleExport, reset,
  } = useVideoEditor();

  const isProcessing = status === "loading-engine" || status === "exporting";

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "var(--bg)" }}>
      <ExportOverlay status={status} progress={progress} />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-6 flex-1 w-full">

        <header className="mb-10 flex items-end justify-between animate-fade-in">
          <div>
            <h1 className="font-display text-6xl leading-none tracking-widest2 text-[var(--text)]">
              REFRAME
            </h1>
            <p className="font-heading text-xs text-[var(--muted)] mt-1 uppercase tracking-widest">
              Your video, any format
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-heading font-semibold uppercase tracking-widest text-[var(--muted)] pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
            No login. No ads. 100% local.
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

          <div className="space-y-4">
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] animate-fade-in">
              <FileUpload onFileSelect={handleFileSelect} currentFile={file} />
              {file && (
                <div className="mt-4 animate-fade-in">
                  <VideoPreview file={file} />
                </div>
              )}
            </div>

            {file && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isProcessing ? "pointer-events-none opacity-50" : ""}`}>
                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6">
                  <Section icon={<Scissors size={12} />} title="Trim" delay={50}>
                    <TrimControl recipe={recipe} onChange={updateRecipe} duration={duration} />
                  </Section>
                  <Section icon={<RotateCw size={12} />} title="Rotate" delay={100}>
                    <RotateControl recipe={recipe} onChange={updateRecipe} />
                  </Section>
                </div>
                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6">
                  <Section icon={<Volume2 size={12} />} title="Audio & Speed" delay={150}>
                    <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
                  </Section>
                  <Section icon={<SlidersHorizontal size={12} />} title="Export quality" delay={200}>
                    <ExportSettings recipe={recipe} onChange={updateRecipe} />
                  </Section>
                </div>
              </div>
            )}

            {status === "error" && error && (
              <div className="flex items-start gap-3 p-4 bg-film-50 border border-film-200 rounded-xl text-film-800 text-sm animate-fade-in">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-film-500" />
                <div>
                  <p className="font-heading font-bold text-sm">Export failed</p>
                  <p className="text-film-600 text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {status === "done" && result && (
              <div className="animate-fade-in">
                <DownloadResult result={result} onReset={reset} />
              </div>
            )}
          </div>

          <div className={`space-y-5 ${isProcessing ? "pointer-events-none opacity-50" : ""}`}>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6 animate-fade-in" style={{ animationDelay: "50ms" }}>
              <Section icon={<Layers size={12} />} title="Output size">
                <PresetSelector recipe={recipe} onChange={updateRecipe} />
              </Section>

              <Section icon={<Crop size={12} />} title="Framing" delay={100}>
                <FramingControl recipe={recipe} onChange={updateRecipe} />
              </Section>
            </div>

            <button
              onClick={handleExport}
              disabled={!file || isProcessing}
              className={`
                w-full flex items-center justify-center gap-3 py-5 rounded-xl
                font-display text-2xl tracking-widest transition-all duration-200
                ${file && !isProcessing
                  ? "bg-film-600 hover:bg-film-700 hover:scale-[1.01] text-white shadow-lg shadow-film-200 active:scale-[0.98] cursor-pointer"
                  : "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
                }
              `}
            >
              <Zap size={20} className={file && !isProcessing ? "animate-pulse" : ""} />
              {isProcessing ? "PROCESSING" : "EXPORT"}
            </button>
          </div>
        </div>
      </div>

      <footer className="w-full border-t border-[var(--border)] py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-heading text-[var(--muted)] tracking-wide">
            2026 Reframe. Free, open source, no login required.
          </p>
          <a
            href="https://github.com/magic-peach/reframe"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-heading font-medium text-[var(--muted)] hover:text-film-600 transition-colors"
          >
            <Github size={13} />
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
