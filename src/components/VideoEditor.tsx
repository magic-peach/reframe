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
  SlidersHorizontal, Zap, AlertTriangle
} from "lucide-react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

// each settings section — icon + uppercase title + thin red rule
function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="space-y-3">
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
    file, recipe, status, progress,
    result, error, updateRecipe,
    handleFileSelect, handleExport, reset,
  } = useVideoEditor();

  const isProcessing = status === "loading-engine" || status === "exporting";

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg)" }}>
      <ExportOverlay status={status} progress={progress} />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-16">

        {/* ── header ── */}
        <header className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="font-display text-6xl leading-none tracking-widest2 text-[var(--text)]">
              REFRAME
            </h1>
            <p className="font-heading text-xs text-[var(--muted)] mt-1 uppercase tracking-widest">
              Your video, any frame
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-heading font-semibold uppercase tracking-widest text-[var(--muted)] pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Runs locally — no uploads
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">

          {/* ── left: file + preview ── */}
          <div className="space-y-4">
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)]">
              <FileUpload onFileSelect={handleFileSelect} currentFile={file} />
              {file && (
                <div className="mt-4">
                  <VideoPreview file={file} />
                </div>
              )}
            </div>

            {status === "error" && error && (
              <div className="flex items-start gap-3 p-4 bg-film-50 border border-film-200 rounded-xl text-film-800 text-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-film-500" />
                <div>
                  <p className="font-heading font-bold text-sm">Export failed</p>
                  <p className="text-film-600 text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {status === "done" && result && (
              <DownloadResult result={result} onReset={reset} />
            )}
          </div>

          {/* ── right: all controls ── */}
          <div className={`space-y-5 ${isProcessing ? "pointer-events-none opacity-50" : ""}`}>
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6">

              <Section icon={<Layers size={12} />} title="Output size">
                <PresetSelector recipe={recipe} onChange={updateRecipe} />
              </Section>

              <Section icon={<Crop size={12} />} title="Framing">
                <FramingControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <Section icon={<Scissors size={12} />} title="Trim">
                <TrimControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <Section icon={<RotateCw size={12} />} title="Rotate">
                <RotateControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <Section icon={<Volume2 size={12} />} title="Audio & Speed">
                <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <Section icon={<SlidersHorizontal size={12} />} title="Export quality">
                <ExportSettings recipe={recipe} onChange={updateRecipe} />
              </Section>
            </div>

            {/* export button */}
            <button
              onClick={handleExport}
              disabled={!file || isProcessing}
              className={`
                w-full flex items-center justify-center gap-3 py-5 rounded-xl
                font-display text-2xl tracking-widest transition-all
                ${file && !isProcessing
                  ? "bg-film-600 hover:bg-film-700 text-white shadow-lg shadow-film-200 active:scale-[0.98] cursor-pointer"
                  : "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
                }
              `}
            >
              <Zap size={20} />
              {isProcessing ? "PROCESSING" : "EXPORT"}
            </button>

            <p className="text-center text-[10px] font-heading uppercase tracking-widest text-[var(--muted)]">
              First run downloads ~30 MB · subsequent exports are instant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
