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
import { cn } from "@/lib/utils";
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
    handleFileSelect, handleExport, cancelExport, reset,
  } = useVideoEditor();

  
  const isProcessing = status === "loading-engine" || status === "exporting";

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "var(--bg)" }}>
      <ExportOverlay status={status} progress={progress} onCancel={cancelExport} />

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
            No login. No ads. 100% private — your video never leaves your device.
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

          <div className="space-y-4">
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] animate-fade-in">
              <FileUpload onFileSelect={handleFileSelect} currentFile={file} />

              {!file && (
              <div className="text-center text-gray-500 py-6">
                <p>Upload a video to get started</p>
                <p className="text-sm">Supports MP4, MOV, WebM and more</p>
              </div>
              )}

              {file && (
                <div className="mt-4 animate-fade-in">
                  <VideoPreview file={file} />
                </div>
              )}
            </div>

            {file && file.size > 100 * 1024 * 1024 && (
              <p className="text-yellow-400 text-sm">
                ⚠️ Large file — processing may take several minutes
              </p>
            )}      
            {file && (
              <div className={cn(
                "grid grid-cols-1 sm:grid-cols-2 gap-4",
                isProcessing && "pointer-events-none opacity-50"
              )}>
                <div className="bg-
