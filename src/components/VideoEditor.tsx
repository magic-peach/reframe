"use client";

import { useState } from "react";

import { useState, useRef, useEffect, useMemo } from "react";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import FileUpload from "./FileUpload";
import VideoPreview from "./VideoPreview";
import ThumbnailStrip from "./ThumbnailStrip";
import PresetSelector from "./PresetSelector";
import FramingControl from "./FramingControl";
import TrimControl from "./TrimControl";
import RotateControl from "./RotateControl";
import AudioSpeedControl from "./AudioSpeedControl";
import FormatSelector from "./FormatSelector";
import ExportSettings from "./ExportSettings";
import ExportOverlay from "./ExportOverlay";
import DownloadResult from "./DownloadResult";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BadgeCheck,
  Crop,
  Layers,
  RotateCw,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Volume2,
  Zap,
} from "lucide-react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  description?: string;
  delay?: number;
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

function Section({ icon, title, description, children, delay = 0 }: SectionProps) {
  return (
    <div className="space-y-3 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--film-50)] text-[var(--film-600)]">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
              {description}
            </p>
          )}
        </div>
      <div className="flex items-center gap-2">
        <span className="text-film-500 opacity-80">{icon}</span>
        <h3 className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </h3>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      {children}
    </div>
  );
}

function AdjustmentSlider({
  label,
  value,
  min,
  max,
  step,
  resetValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  resetValue: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-[var(--text)]">{label}</label>
        <button
          type="button"
          onClick={() => onChange(resetValue)}
          className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--accent)]"
        >
          Reset
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-full cursor-pointer"
      />
    </div>
  );
}

export default function VideoEditor() {
  const {
    file,
    duration,
    recipe,
    status,
    progress,
    result,
    error,
    updateRecipe,
    handleFileSelect,
    handleExport,
    cancelExport,
    reset,
    resetSettings,
    file, duration, recipe, status, progress,
    result, error, updateRecipe,
    handleFileSelect, fileError, handleExport, cancelExport, reset, resetSettings,
    videoRef,
    seekTo,
  } = useVideoEditor();
  const [copied, setCopied] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "done" && downloadRef.current) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      downloadRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? "instant" : "smooth",
        block: "center",
      });
    }
  }, [status]);

  const isProcessing = status === "loading-engine" || status === "exporting";

  const videoSrc = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <ExportOverlay status={status} progress={progress} onCancel={cancelExport} />

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status === "exporting" && `Exporting video: ${progress}%`}
        {status === "done" && "Export complete. Video ready to download."}
        {status === "error" && `Export failed: ${error}`}
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <header className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="animate-fade-in">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] shadow-sm">
              <BadgeCheck size={14} className="text-[var(--accent)]" />
              Private browser editing
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
              Reframe videos for any channel.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Upload, resize, trim, rotate, tune, and export without your video leaving this device.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-center shadow-sm animate-fade-in">
            {["Upload", "Adjust", "Export"].map((item, index) => (
              <div
                key={item}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-semibold text-[var(--muted)]",
                  index === 0 && file && "bg-[var(--surface-soft)]",
                  index === 1 &&
                    file &&
                    !result &&
                    "bg-[var(--film-50)] !text-[var(--film-700)]",
                  index === 2 && result && "bg-[var(--film-50)] !text-[var(--film-700)]",
                  !file && index === 0 && "bg-[var(--film-50)] !text-[var(--film-700)]"
                )}
              >
                {item}
              </div>
            ))}
            <p className="font-heading text-sm text-[var(--muted)] mt-1 uppercase tracking-widest">
              Your video, any format
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm font-heading font-semibold uppercase tracking-widest text-[var(--muted)] pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
            No login. No ads. 100% private - your video never leaves your device.
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="space-y-5">
            <Panel className="animate-fade-in">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">Source video</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Start with a local video file. Common formats up to 2GB are supported.
                  </p>
                </div>
                <Upload size={20} className="hidden text-[var(--muted)] sm:block" />
              </div>

              <FileUpload onFileSelect={handleFileSelect} currentFile={file} />

              {file ? (
                <div className="mt-5 animate-fade-in">
                  <VideoPreview file={file} />
          <div className="space-y-4">
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] animate-fade-in">
              <FileUpload onFileSelect={handleFileSelect} currentFile={file} fileError={fileError} />

              {!file && (
              <div className="text-center text-[var(--muted)] py-6">
                <p>Upload a video to get started</p>
                <p className="text-sm">Supports MP4, MOV, WebM and more</p>
              </div>
              )}

              {file && (
                <div className="mt-4 animate-fade-in">
                  <VideoPreview file={file} videoRef={videoRef} />

                  <div className="mt-3">
                    <ThumbnailStrip
                      videoSrc={videoSrc}
                      duration={duration}
                      currentTime={videoRef.current?.currentTime ?? 0}
                      trimStart={recipe.trimStart ?? 0}
                      trimEnd={recipe.trimEnd ?? duration}
                      onSeek={seekTo}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-5 text-center text-sm text-[var(--muted)]">
                  Choose a video to unlock editing controls.
                </div>
              )}
            </Panel>

            {file && file.size > 100 * 1024 * 1024 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                Large file detected. Processing may take several minutes on this device.
              </div>
            )}

              <p className="text-[var(--warning)] text-sm">
                ⚠️ Large file - processing may take several minutes
              </p>
            )}      
            {file && (
              <div
                className={cn(
                  "grid grid-cols-1 gap-5 xl:grid-cols-2",
                  isProcessing && "pointer-events-none opacity-55"
                )}
              >
                <Panel className="space-y-7">
                  <Section
                    icon={<Scissors size={16} />}
                    title="Trim"
                    description="Set an optional start and end point."
                    delay={50}
                  >
                    <TrimControl recipe={recipe} onChange={updateRecipe} duration={duration} />
                  </Section>

                  <Section
                    icon={<RotateCw size={16} />}
                    title="Rotation"
                    description="Correct orientation in quarter turns."
                    delay={100}
                  >
                    <RotateControl recipe={recipe} onChange={updateRecipe} />
                  </Section>

                  <Section
                    icon={<SlidersHorizontal size={16} />}
                    title="Color adjustments"
                    description="Lightly tune the look before export."
                    delay={150}
                  >
                    <div className="space-y-5">
                      <AdjustmentSlider
                        label="Brightness"
                        min={-1}
                        max={1}
                        step={0.1}
                        value={recipe.brightness}
                        resetValue={0}
                        onChange={(brightness) => updateRecipe({ brightness })}
                      />
                      <AdjustmentSlider
                        label="Contrast"
                        min={0}
                        max={2}
                        step={0.1}
                        value={recipe.contrast}
                        resetValue={1}
                        onChange={(contrast) => updateRecipe({ contrast })}
                      />
                      <AdjustmentSlider
                        label="Saturation"
                        min={0}
                        max={3}
                        step={0.1}
                        value={recipe.saturation}
                        resetValue={1}
                        onChange={(saturation) => updateRecipe({ saturation })}
                      />
                    </div>
                  </Section>
                </Panel>
                </div>
                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6">
                  <Section icon={<Volume2 size={12} />} title="Audio & Speed" delay={150}>
                  <Section
  icon={<SlidersHorizontal size={12} />}
  title="Adjustments"
  delay={175}
>
  <div className="space-y-5">

    {/* Brightness */}
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor="brightness-slider">Brightness</label>

        <button
          type="button"
          onClick={() => updateRecipe({ brightness: 0 })}
          className="text-film-500 hover:underline"
        >
          Reset
        </button>
      </div>

      <input
        id="brightness-slider"
        type="range"
        min="-1"
        max="1"
        step="0.1"
        value={recipe.brightness}
        onChange={(e) =>
          updateRecipe({
            brightness: Number(e.target.value),
          })
        }
        aria-label="Adjust brightness"
        className="w-full"
      />
    </div>

    {/* Contrast */}
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor="contrast-slider">Contrast</label>

        <button
          type="button"
          onClick={() => updateRecipe({ contrast: 1 })}
          className="text-film-500 hover:underline"
        >
          Reset
        </button>
      </div>

      <input
        id="contrast-slider"
        type="range"
        min="0"
        max="2"
        step="0.1"
        value={recipe.contrast}
        onChange={(e) =>
          updateRecipe({
            contrast: Number(e.target.value),
          })
        }
        aria-label="Adjust contrast"
        className="w-full"
      />
    </div>

    {/* Saturation */}
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor="saturation-slider">Saturation</label>

        <button
          type="button"
          onClick={() => updateRecipe({ saturation: 1 })}
          className="text-film-500 hover:underline"
        >
          Reset
        </button>
      </div>

      <input
        id="saturation-slider"
        type="range"
        min="0"
        max="3"
        step="0.1"
        value={recipe.saturation}
        onChange={(e) =>
          updateRecipe({
            saturation: Number(e.target.value),
          })
        }
        aria-label="Adjust saturation"
        className="w-full"
      />
    </div>

                <Panel className="space-y-7">
                  <Section
                    icon={<Volume2 size={16} />}
                    title="Audio and speed"
                    description="Keep sound, mute, or change playback pace."
                    delay={175}
                  >
                    <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
                  </Section>

                  <Section
                    icon={<SlidersHorizontal size={16} />}
                    title="Output format"
                    description="Choose the container for the final file."
                    delay={190}
                  >
                    <FormatSelector recipe={recipe} onChange={updateRecipe} />
                  </Section>

                  <Section
                    icon={<Sparkles size={16} />}
                    title="Export settings"
                    description="Balance quality, file size, and processing time."
                    delay={200}
                  >
                    <ExportSettings recipe={recipe} onChange={updateRecipe} />
                  </Section>
                </Panel>
              </div>
            )}

            {status === "error" && error && (
              <div
                role="status"
                className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 animate-fade-in sm:flex-row sm:items-start"
              >
                <AlertTriangle size={18} className="shrink-0 sm:mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Export failed</p>
                  <p className="mt-1 text-xs leading-relaxed">{error}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(error).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    aria-label="Copy error message to clipboard"
                className="flex items-start gap-3 p-4 bg-film-50 border border-film-200 rounded-xl text-film-800 text-sm animate-fade-in"
              >
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-film-500" />
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm">Error</p>
                  <p className="text-film-600 text-sm mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(error).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="px-3 py-1.5 bg-[var(--border)] border border-[var(--border)] rounded-lg text-sm font-semibold hover:opacity-80 transition-colors shrink-0 whitespace-nowrap"
                  aria-label="Copy error message to clipboard"
                >
                  {copied ? "Copied!" : "Copy error"}
                </button>
                {!error.includes("Validation Failed") && (
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-3 py-1.5 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg text-sm font-semibold hover:bg-[var(--error-hover)] hover:border-[var(--error)] text-[var(--text)] transition-colors shrink-0 whitespace-nowrap"
                  >
                    {copied ? "Copied" : "Copy error"}
                  </button>
                  {!error.includes("Validation Failed") && (
                    <button
                      type="button"
                      onClick={handleExport}
                      className="rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                    >
                      Retry Export
                    </button>
                  )}
                </div>
              </div>
            )}

            {status === "done" && result && (
              <div role="status" className="animate-fade-in" ref={downloadRef}>
                <DownloadResult result={result} onReset={reset} />
              </div>
            )}
          </div>

          <aside
            className={cn(
              "space-y-5 lg:sticky lg:top-24",
              isProcessing && "pointer-events-none opacity-55"
            )}
          >
            <Panel className="space-y-7 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text)]">Output setup</h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  Pick the destination size and how the video should sit inside the frame.
                </p>
              </div>

              <Section icon={<Layers size={16} />} title="Output size">
                <PresetSelector recipe={recipe} onChange={updateRecipe} />
              </Section>

              <Section icon={<Crop size={16} />} title="Framing" delay={100}>
                <FramingControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <button
                type="button"
                onClick={resetSettings}
                className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Reset all settings
              </button>
            </Panel>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={resetSettings}
                  className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)] hover:text-film-600 transition-all opacity-60 hover:opacity-100"
                >
                  Reset all settings
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={!file || isProcessing}
              aria-label="Export video"
              aria-disabled={!file || isProcessing ? "true" : undefined}
              className={cn(
                "w-full rounded-2xl px-5 py-4 text-base font-bold shadow-[var(--shadow)] transition-all duration-200",
                "flex items-center justify-center gap-3",
                file && !isProcessing
                  ? "bg-[var(--accent)] text-white hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] active:translate-y-0"
                  : "cursor-not-allowed border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] opacity-70"
              )}
            >
              <Zap size={20} className={cn(file && !isProcessing && "animate-pulse")} />
              {isProcessing ? "Processing" : "Export video"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}