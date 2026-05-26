"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import { TextOverlay } from "@/lib/types";
import FileUpload from "./FileUpload";
import VideoPreview from "./VideoPreview";
import ThumbnailStrip from "./ThumbnailStrip";
import PresetSelector from "./PresetSelector";
import FramingControl from "./FramingControl";
import TrimControl from "./TrimControl";
import RotateControl from "./RotateControl";
import TextControls from "./TextControls";
import AudioSpeedControl from "./AudioSpeedControl";
import FormatSelector from "./FormatSelector";
import ExportSettings from "./ExportSettings";
import ExportOverlay from "./ExportOverlay";
import DownloadResult from "./DownloadResult";
import ImageOverlay from "./ImageOverlay"
import { getPresetById } from "@/lib/presets";

import { cn } from "@/lib/utils";
import {
  Layers, RotateCw, Volume2, Type,
  SlidersHorizontal, Zap, AlertTriangle, Copy
} from "lucide-react";
import OnboardingTour from "./OnboardingTour";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

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
        <h3 className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </h3>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      {children}
    </div>
  );
}

/** Accordion section with collapsible content. */
function AccordionSection({
  id,
  icon,
  title,
  children,
  isOpen,
  onToggle,
  delay = 0,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  delay?: number;
}) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--border)] transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <span className="text-film-500 opacity-80">{icon}</span>
          <span className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)]">{title}</span>
        </div>
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={cn("text-[var(--muted)] transition-transform duration-200", isOpen && "rotate-180")}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        id={`${id}-panel`}
        className={cn(
          "transition-all duration-200",
          isOpen ? "block" : "hidden"
        )}
      >
        <div className="px-3 pt-3 pb-0">{children}</div>
      </div>
    </div>
  );
}

/** Inline keyboard hint badge. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[10px] font-mono text-[var(--muted)] leading-none">
      {children}
    </kbd>
  );
}

/** Collapsible panel that lists all keyboard shortcuts. */
function KeyboardShortcutsPanel() {
  const [open, setOpen] = useState(false);

  const shortcuts: { keys: React.ReactNode[]; label: string }[] = [
  {
    keys: [
      <Kbd key="ctrl">Ctrl</Kbd>,
      <span key="plus1" className="text-[var(--muted)] text-xs">+</span>,
      <Kbd key="shift">Shift</Kbd>,
      <span key="plus2" className="text-[var(--muted)] text-xs">+</span>,
      <Kbd key="e">E</Kbd>
    ],
    label: "Export video",
  },
  {
    keys: [<Kbd key="m">M</Kbd>],
    label: "Toggle audio mute",
  },
  {
    keys: [<Kbd key="r">R</Kbd>],
    label: "Reset all settings",
  },
  {
    keys: [<Kbd key="esc">Esc</Kbd>],
    label: "Cancel export",
  },
  {
    keys: [<Kbd key="1">1</Kbd>, <span key="dash" className="text-[var(--muted)] text-xs">–</span>, <Kbd key="9">9</Kbd>],
    label: "Switch preset by index",
  },
  {
    keys: [<Kbd key="question">?</Kbd>],
    label: "Toggle this panel",
  },
];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-fade-in overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="keyboard-shortcuts-list"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--border)] transition-colors duration-150"
      >
        <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--muted)] flex items-center gap-2">
          <Kbd>⌨</Kbd>
          Keyboard Shortcuts
        </span>
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={cn("text-[var(--muted)] transition-transform duration-200", open && "rotate-180")}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          id="keyboard-shortcuts-list"
          className="px-4 pb-3 space-y-2 border-t border-[var(--border)]"
        >
          {shortcuts.map(({ keys, label }) => (
            <li key={label} className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-[var(--muted)]">{label}</span>
              <span className="flex items-center gap-1 shrink-0">{keys}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VideoEditor() {
  const {
    file, duration, recipe, status, progress,
    result, error, exportStartedAt, updateRecipe,
    handleFileSelect, fileError, handleExport, cancelExport, reset, resetSettings,
    videoRef,
    seekTo,
    overlayFile, setOverlayFile,
    overlayPosition, setOverlayPosition,
    overlaySize, setOverlaySize,
    overlayOpacity, setOverlayOpacity,
    recommendedPreset,
    currentTime,
    toggleSound,
  } = useVideoEditor();

  useKeyboardShortcuts({
    file,
    recipe,
    resetSettings,
    updateRecipe,
    handleExport,
    status,
    cancelExport,
    onToggleShortcutsModal: () => {},
  });

  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    resize: true,
    trim: false,
    rotation: false,
    text: false,
    audio: false,
    export: false,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const downloadRef = useRef<HTMLDivElement>(null);

  /**
   * Updates a text overlay property and syncs with recipe.
   */
  const handleUpdateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    const updatedOverlays = (recipe.textOverlays || []).map((overlay) =>
      overlay.id === id ? { ...overlay, ...updates } : overlay
    );
    updateRecipe({ textOverlays: updatedOverlays });
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const encoded = btoa(JSON.stringify(recipe));
    const url = new URL(window.location.href);
    url.searchParams.set("settings", encoded);
    history.replaceState(null, "", url.toString());
    navigator.clipboard.writeText(url.toString()).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

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
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  const intervalSeconds = useMemo(() => {
    if (duration <= 30) return 2;
    if (duration <= 120) return 5;
    if (duration <= 300) return 15;
    return 30;
  }, [duration]);

  const videoSrc = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  const exportSummary = useMemo(() => {
    const preset = getPresetById(recipe.preset);
    const width = recipe.preset === "custom" ? recipe.customWidth : (preset?.width ?? recipe.customWidth);
    const height = recipe.preset === "custom" ? recipe.customHeight : (preset?.height ?? recipe.customHeight);

    const framingLabel = recipe.framing === "fit" ? "Fit" : "Fill";
    const speedLabel = `${recipe.speed}× speed`;
    const qualityLabel = recipe.quality <= 21
      ? "High"
      : recipe.quality <= 25
      ? "Balanced"
      : "Small file";

    return `Exporting to ${width}×${height} ${recipe.format.toUpperCase()} • ${framingLabel} • ${speedLabel} • Quality: ${qualityLabel}`;
  }, [recipe]);

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "var(--bg)" }}>
      <ExportOverlay
        status={status}
        progress={progress}
        exportStartedAt={exportStartedAt}
        onCancel={cancelExport}
      />
      <OnboardingTour />

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status === "exporting" && `Exporting video: ${progress}%`}
        {status === "done" && "Export complete! Video ready to download."}
        {status === "error" && `Export failed: ${error}`}
      </div>

      <div className="mx-auto flex-1 w-full px-3 py-4">
        <header className="mb-4 animate-fade-in">
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-film-600">
                Studio
              </p>
              <h1 className="text-xl font-display tracking-widest text-[var(--text)]">
                Reframe Editor
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-heading font-semibold uppercase tracking-widest text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Private browser render
              {file && <span className="hidden sm:inline text-[var(--border)]">|</span>}
              {file && <span>{exportSummary}</span>}
            </div>
          </div>
        </header>
        <div
          className={cn(
            "grid grid-cols-1 gap-5",
            file ? "xl:grid-cols-[320px_minmax(0,1fr)_340px]" : "max-w-5xl mx-auto"
          )}
        >

          <aside
            className={cn(
              "space-y-4 min-w-0 transition-opacity duration-300 xl:sticky xl:top-24 xl:self-start",
              isProcessing && "pointer-events-none opacity-50"
            )}
          >
            <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] animate-fade-in shadow-sm">
              <FileUpload onFileSelect={handleFileSelect} currentFile={file} fileError={fileError} duration={duration} />

              {!file && (
                <div className="grid gap-3 border-t border-[var(--border)] mt-3 pt-3 text-[var(--muted)] sm:grid-cols-3">
                  <div className="rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2">
                    <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--text)]">Import</p>
                    <p className="text-xs mt-1">MP4, MOV, AVI, MKV, WebM</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2">
                    <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--text)]">Edit</p>
                    <p className="text-xs mt-1">Trim, crop, text, audio, color</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg)] border border-[var(--border)] px-3 py-2">
                    <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--text)]">Export</p>
                    <p className="text-xs mt-1">Runs privately in your browser</p>
                  </div>
                </div>
              )}

            </div>

            {file && file.size > 100 * 1024 * 1024 && (
              <p className="text-[var(--warning)] text-sm">
                ⚠️ Large file - processing may take several minutes
              </p>
            )}
            {file && (
              <div className={cn(
                "grid grid-cols-1 gap-4",
                isProcessing && "pointer-events-none opacity-50"
              )}>
                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6 shadow-sm">
                  <AccordionSection
                    id="resize"
                    icon={<Layers size={12} />}
                    title="Canvas & Resize"
                    isOpen={openSections.resize}
                    onToggle={() => toggleSection("resize")}
                    delay={25}
                  >
                    {recommendedPreset && (
                      <div className="mb-4 rounded-lg border border-film-200 bg-film-50 p-3 text-sm text-film-700">
                        <p>
                          Detected {recommendedPreset.label.replace(/\s/g, "")}. Recommended: {(recommendedPreset.platform.split("·")[0] ?? "").trim()}.
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <PresetSelector recipe={recipe} onChange={updateRecipe} />
                      <FramingControl recipe={recipe} onChange={updateRecipe} />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    id="rotation"
                    icon={<RotateCw size={12} />}
                    title="Rotation"
                    isOpen={openSections.rotation}
                    onToggle={() => toggleSection("rotation")}
                    delay={100}
                  >
                    <RotateControl recipe={recipe} onChange={updateRecipe} />
                  </AccordionSection>

                  <AccordionSection
                    id="text"
                    icon={<Type size={12} />}
                    title="Text Overlay"
                    isOpen={openSections.text}
                    onToggle={() => toggleSection("text")}
                    delay={110}
                  >
                    <TextControls
                      recipe={recipe}
                      onChange={updateRecipe}
                      selectedTextId={selectedTextId}
                      onSelectText={setSelectedTextId}
                    />
                  </AccordionSection>
                </div>
              </div>
            )}
          </aside>

          {file && (
            <main className="space-y-4 min-w-0">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm animate-fade-in">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-film-600">
                      Program Monitor
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Center preview
                    </p>
                  </div>
                  <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
                    {recipe.framing} view
                  </div>
                </div>
                <VideoPreview
                  file={file}
                  recipe={recipe}
                  videoRef={videoRef}
                  selectedTextId={selectedTextId}
                  onSelectText={setSelectedTextId}
                  onUpdateText={handleUpdateTextOverlay}
                />
              </div>

              <div
                className={cn(
                  "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm animate-fade-in",
                  isProcessing && "pointer-events-none opacity-50"
                )}
              >
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-film-600">
                      Timeline & Audio Graph
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Trim handles, thumbnails, and waveform
                    </p>
                  </div>
                  <p className="text-xs font-mono text-[var(--muted)]">
                    {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                  </p>
                </div>
                <div className="space-y-4">
                  <ThumbnailStrip
                    videoSrc={videoSrc}
                    duration={duration}
                    currentTime={currentTime}
                    trimStart={recipe.trimStart ?? 0}
                    trimEnd={recipe.trimEnd ?? duration}
                    onSeek={seekTo}
                    intervalSeconds={intervalSeconds}
                  />
                  <TrimControl
                    recipe={recipe}
                    onChange={updateRecipe}
                    duration={duration}
                    file={file}
                  />
                </div>
              </div>

              {status === "error" && error && (
              <div
                role="status"
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
                    }).catch((err) => {
                      console.error("Failed to copy error to clipboard:", err);
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
                    Retry Export
                  </button>
                )}
              </div>
              )}

              {status === "done" && result && (
              <div role="status" className="animate-fade-in" ref={downloadRef}>
                <DownloadResult result={result} onReset={reset} soundOnCompletion={recipe.soundOnCompletion} onToggleSound={toggleSound} />
              </div>
              )}
            </main>
          )}

          {file && (
            <aside
              className={cn(
                "space-y-4 transition-opacity duration-300 sticky top-8 self-start",
                isProcessing && "pointer-events-none opacity-50"
              )}
            >
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm animate-fade-in">
                <p className="text-[10px] font-heading font-bold text-film-600 uppercase tracking-widest">
                  Render Queue
                </p>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                  {exportSummary}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-widest text-film-500 hover:text-film-600 transition-all cursor-pointer"
                  >
                    <Copy size={12} />
                    {shareCopied ? "Copied!" : "Copy Link"}
                  </button>
                  <button
                    type="button"
                    onClick={resetSettings}
                    className="text-xs font-heading font-bold uppercase tracking-widest text-[var(--muted)] hover:text-film-600 transition-all opacity-70 hover:opacity-100"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-5 shadow-sm animate-fade-in">
                <AccordionSection
                  id="audio"
                  icon={<Volume2 size={12} />}
                  title="Audio & Speed"
                  isOpen={openSections.audio}
                  onToggle={() => toggleSection("audio")}
                  delay={150}
                >
                  <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
                </AccordionSection>

                <Section
                  icon={<SlidersHorizontal size={12} />}
                  title="Adjustments"
                  delay={175}
                >
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="brightness-slider">Brightness</label>
                        <button
                          type="button"
                          onClick={() => updateRecipe({ brightness: 0 })}
                          className="text-film-500 hover:underline"
                          aria-label="reset brightness"
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
                        onChange={(e) => updateRecipe({ brightness: Number(e.target.value) })}
                        aria-label="Adjust brightness"
                        className="w-full accent-film-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="contrast-slider">Contrast</label>
                        <button
                          type="button"
                          onClick={() => updateRecipe({ contrast: 1 })}
                          className="text-film-500 hover:underline"
                          aria-label="reset-contrast"
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
                        onChange={(e) => updateRecipe({ contrast: Number(e.target.value) })}
                        aria-label="Adjust contrast"
                        className="w-full accent-film-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="saturation-slider">Saturation</label>
                        <button
                          type="button"
                          onClick={() => updateRecipe({ saturation: 1 })}
                          className="text-film-500 hover:underline"
                          aria-label="reset-saturation"
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
                        onChange={(e) => updateRecipe({ saturation: Number(e.target.value) })}
                        aria-label="Adjust saturation"
                        className="w-full accent-film-600"
                      />
                    </div>
                  </div>
                </Section>

                <Section icon={<SlidersHorizontal size={12} />} title="Output format" delay={190}>
                  <FormatSelector recipe={recipe} onChange={updateRecipe} />
                </Section>

                <AccordionSection
                  id="export"
                  icon={<SlidersHorizontal size={12} />}
                  title="Export"
                  isOpen={openSections.export}
                  onToggle={() => toggleSection("export")}
                  delay={200}
                >
                  <ExportSettings recipe={recipe} duration={duration} onChange={updateRecipe} />
                </AccordionSection>

                <Section icon={<Layers size={12} />} title="Image overlay" delay={120}>
                  <ImageOverlay
                    overlayFile={overlayFile}
                    setOverlayFile={setOverlayFile}
                    overlayPosition={overlayPosition}
                    setOverlayPosition={setOverlayPosition}
                    overlaySize={overlaySize}
                    setOverlaySize={setOverlaySize}
                    overlayOpacity={overlayOpacity}
                    setOverlayOpacity={setOverlayOpacity}
                  />
                </Section>
              </div>

              <KeyboardShortcutsPanel />

              <button
                id="export-button"
                type="button"
                onClick={handleExport}
                disabled={isProcessing}
                aria-label="Export video"
                aria-disabled={isProcessing ? "true" : undefined}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-5 min-h-[44px] rounded-xl",
                  "font-display text-2xl tracking-widest transition-all duration-200",
                  !isProcessing
                    ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:scale-[1.02] text-white shadow-[var(--shadow)] active:scale-[0.98] cursor-pointer"
                    : "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
                )}
              >
                <Zap size={20} className={cn(!isProcessing && "animate-pulse")} />
                {isProcessing ? "PROCESSING" : "EXPORT"}
              </button>

              {!isProcessing && (
                <p className="text-xs text-center font-mono text-[var(--muted)] opacity-50 mt-1">
                  {isMac ? "⌘" : "Ctrl"} + Enter to export
                </p>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
