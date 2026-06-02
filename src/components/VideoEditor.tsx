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
import ImageOverlay from "./ImageOverlay";
import { getPresetById } from "@/lib/presets";

import { cn } from "@/lib/utils";
import {
  Layers, Crop, Scissors, RotateCw, Volume2, Type,
  SlidersHorizontal, Zap, AlertTriangle, Copy, Download
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
    videoRef, seekTo, overlayFile, setOverlayFile,
    overlayPosition, setOverlayPosition, overlaySize, setOverlaySize,
    overlayOpacity, setOverlayOpacity, recommendedPreset, currentTime, toggleSound,
  } = useVideoEditor();

  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    resize: true, trim: false, rotation: false, text: false, audio: false, export: false,
  });

  const dragCounter = useRef(0);
  const downloadRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts({
    file, recipe, resetSettings, updateRecipe, handleExport, status, cancelExport, onToggleShortcutsModal: () => {},
  });

  // Unified Setup Effect (Loads storage data safely ONCE on boot sequence)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("editorState");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed.recipe) updateRecipe(parsed.recipe);
      if (parsed.overlayPosition) setOverlayPosition(parsed.overlayPosition);
      if (parsed.overlaySize) setOverlaySize(parsed.overlaySize);
      if (parsed.overlayOpacity) setOverlayOpacity(parsed.overlayOpacity);
    } catch (err) {
      console.error("Failed to restore editor state", err);
    }
  }, []);

  // Safe Auto-Save Sync Effect with Storage Quota Guard rails
  useEffect(() => {
    if (!file || typeof window === "undefined") return;

    try {
      localStorage.setItem(
        "editorState",
        JSON.stringify({
          recipe,
          overlayPosition,
          overlaySize,
          overlayOpacity,
        })
      );
    } catch (err) {
      console.warn("Storage quota exceeded. Clearing previous state fallback.", err);
      localStorage.removeItem("editorState");
    }
  }, [recipe, overlayPosition, overlaySize, overlayOpacity, file]);

  // Global window listeners for foolproof drag and drop feedback loop
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];
        // 👇 FIXED: Added checking fallback to explicitly satisfy strict structural checks
        if (droppedFile && droppedFile.type.startsWith("video/")) {
          handleFileSelect(droppedFile);
        } else {
          alert("Please drop a valid video file format.");
        }
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [handleFileSelect]);

  useEffect(() => {
    if (status === "done" && downloadRef.current) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      downloadRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? "instant" : "smooth",
        block: "center",
      });
    }
  }, [status]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (file) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [file]);

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

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

  const isProcessing = status === "loading-engine" || status === "exporting";

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
    const width = recipe.preset === "custom" ? (recipe.customWidth || 1920) : (preset?.width || 1920);
    const height = recipe.preset === "custom" ? (recipe.customHeight || 1080) : (preset?.height || 1080);

    const framingLabel = recipe.framing === "fit" ? "Fit" : "Fill";
    const speedLabel = `${recipe.speed}× speed`;
    const qualityLabel = recipe.quality <= 21 ? "High" : recipe.quality <= 25 ? "Balanced" : "Small file";

    return `Exporting to ${width}×${height} ${recipe.format.toUpperCase()} • ${framingLabel} • ${speedLabel} • Quality: ${qualityLabel}`;
  }, [recipe]);

  // Instant Memory-Safe Cleanup Footprint
  useEffect(() => {
    const currentSrc = videoSrc;
    return () => {
      if (currentSrc) URL.revokeObjectURL(currentSrc);
    };
  }, [videoSrc]);

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "var(--bg)" }}>
      {isDragging && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex flex-col items-center justify-center pointer-events-none border-4 border-dashed border-film-500 m-4 rounded-2xl transition-all animate-fade-in">
          <div className="p-5 bg-film-600 text-white rounded-full mb-4 shadow-xl animate-bounce">
            <Download size={32} />
          </div>
          <h2 className="text-2xl font-display tracking-widest text-white uppercase">Drop to Import Video</h2>
          <p className="text-sm text-gray-300 font-heading uppercase tracking-wider mt-2">Supports MP4, MOV, WebM formats</p>
        </div>
      )}

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

      <div className="max-w-6xl mx-auto px-4 py-8 pb-6 flex-1 w-full">
        <header className="mb-10 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div
            className="inline-block rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm border-l-4 border-l-film-600 mx-auto w-fit min-w-min"
            style={{ padding: 'clamp(0.75rem,3vw,1.25rem) clamp(1rem,5vw,2rem)', boxSizing: 'border-box' }}
            aria-label="Reframe — video editor"
          >
            <h1
              className="font-display leading-none tracking-widest2 text-[var(--text)] break-words text-center transition-all"
              style={{ fontSize: 'clamp(2rem,10vw,4rem)', viewTransitionName: 'reframe-text' }}
            >
              REFRAME
            </h1>
            <p
              className="font-heading text-[var(--muted)] uppercase tracking-widest text-center"
              style={{ fontSize: 'clamp(0.7rem,2vw,0.875rem)', marginTop: 'clamp(0.25rem,1vw,0.5rem)' }}
            >
              Your video, any format
            </p>
          </div>  
          <div className="flex flex-wrap justify-center text-center items-center gap-2 text-sm font-heading font-semibold uppercase tracking-widest text-[var(--muted)] pb-1">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block animate-pulse" />
            No login. No ads. 100% private - your video never leaves your device.
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <div className="space-y-4 min-w-0">
            <div className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)] animate-fade-in">
              <FileUpload onFileSelect={handleFileSelect} currentFile={file} fileError={fileError} duration={duration} />

              {!file && (
                <div className="text-center text-[var(--muted)] py-6">
                  <p>Upload a video to get started</p>
                  <p className="text-sm">Supports MP4, MOV, WebM and more</p>
                </div>
              )}

              {file && (
                <div className="mt-4 animate-fade-in">
                  <VideoPreview
                    file={file}
                    recipe={recipe}
                    videoRef={videoRef}
                    selectedTextId={selectedTextId}
                    onSelectText={setSelectedTextId}
                    onUpdateText={handleUpdateTextOverlay}
                  />

                  <div className="mt-3">
                    <ThumbnailStrip
                      videoSrc={videoSrc}
                      duration={duration}
                      currentTime={currentTime}
                      trimStart={recipe.trimStart ?? 0}
                      trimEnd={recipe.trimEnd ?? duration}
                      onSeek={seekTo}
                      intervalSeconds={intervalSeconds}
                    />
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
              <div className={cn("grid grid-cols-1 gap-4", isProcessing && "pointer-events-none opacity-50")}>
                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6">
                  <AccordionSection
                    id="trim"
                    icon={<Scissors size={12} />}
                    title="Trim"
                    isOpen={openSections.trim}
                    onToggle={() => toggleSection("trim")}
                    delay={50}
                  >
                    <TrimControl recipe={recipe} onChange={updateRecipe} duration={duration} file={file} />
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

                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer select-none list-none text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--muted)] py-1">
                      <span className="text-film-500 opacity-80 transition-transform duration-200 group-open:rotate-90">›</span>
                      Advanced settings
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </summary>
                    <div className="mt-4 space-y-4">
                      <AccordionSection
                        id="export"
                        icon={<SlidersHorizontal size={12} />}
                        title="Export Config"
                        isOpen={openSections.export}
                        onToggle={() => toggleSection("export")}
                      >
                        <ExportSettings recipe={recipe} duration={duration} onChange={updateRecipe} />
                      </AccordionSection>
                    </div>
                  </details>
                </div>

                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6">
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

                  <Section icon={<SlidersHorizontal size={12} />} title="Adjustments" delay={175}>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="brightness-slider-field">Brightness</label>
                          <button type="button" onClick={() => updateRecipe({ brightness: 0 })} className="text-film-500 hover:underline">Reset</button>
                        </div>
                        <input id="brightness-slider-field" type="range" min="-1" max="1" step="0.1" value={recipe.brightness} onChange={(e) => updateRecipe({ brightness: Number(e.target.value) })} className="w-full accent-film-600" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="contrast-slider-field">Contrast</label>
                          <button type="button" onClick={() => updateRecipe({ contrast: 1 })} className="text-film-500 hover:underline">Reset</button>
                        </div>
                        <input id="contrast-slider-field" type="range" min="0" max="2" step="0.1" value={recipe.contrast} onChange={(e) => updateRecipe({ contrast: Number(e.target.value) })} className="w-full accent-film-600" />
                      </div>
                    </div>
                  </Section>

                  <Section icon={<SlidersHorizontal size={12} />} title="Output format" delay={190}>
                    <FormatSelector recipe={recipe} onChange={updateRecipe} />
                  </Section>

                  <Section icon={<Layers size={12} />} title="Image overlay" delay={120}>
                    <ImageOverlay
                      overlayFile={overlayFile} setOverlayFile={setOverlayFile}
                      overlayPosition={overlayPosition} setOverlayPosition={setOverlayPosition}
                      overlaySize={overlaySize} setOverlaySize={setOverlaySize}
                      overlayOpacity={overlayOpacity} setOverlayOpacity={setOverlayOpacity}
                    />
                  </Section>
                </div>
              </div>
            )}

            {status === "error" && error && (
              <div role="status" className="flex items-start gap-3 p-4 bg-film-50 border border-film-200 rounded-xl text-film-800 text-sm animate-fade-in">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-film-500" />
                <div className="flex-1">
                  <p className="font-heading font-bold text-sm">Error</p>
                  <p className="text-film-600 text-sm mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(error).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
                  className="px-3 py-1.5 bg-[var(--border)] border border-[var(--border)] rounded-lg text-sm font-semibold hover:opacity-80 transition-colors shrink-0"
                >
                  {copied ? "Copied!" : "Copy error"}
                </button>
                {!error.includes("Validation Failed") && (
                  <button type="button" onClick={handleExport} className="px-3 py-1.5 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg text-sm font-semibold hover:bg-[var(--error-hover)] hover:border-[var(--error)] text-[var(--text)] transition-colors shrink-0">
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
          </div>

          {/* Sidebar */}
          <div className={cn("space-y-5 transition-opacity duration-300 sticky top-8 self-start", (isProcessing || !file) && "pointer-events-none opacity-50")}>
            {!file && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 animate-fade-in">
                <p className="text-[10px] font-heading font-bold text-film-600 uppercase tracking-widest">Getting Started</p>
                <p className="text-xs text-[var(--muted)] mt-1">Upload a video file to enable these export settings.</p>
              </div>
            )}
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-6 animate-fade-in">
              <AccordionSection id="resize" icon={<Layers size={12} />} title="Resize & Aspect Ratio" isOpen={openSections.resize} onToggle={() => toggleSection("resize")}>
                {recommendedPreset?.label && (
                  <div className="mb-4 rounded-2xl border border-film-200 bg-film-50 p-3 text-sm text-film-700">
                    <p>We detected a {recommendedPreset.label.replace(/\s/g, "")} video → Recommended: {recommendedPreset.platform ? (recommendedPreset.platform.split("·")[0] ?? "").trim() : ""} ({recommendedPreset.label.replace(/\s/g, "")})</p>
                  </div>
                )}
                <div className="space-y-3">
                  <PresetSelector recipe={recipe} onChange={updateRecipe} />
                  
                  {/* Custom Aspect Ratio Inputs */}
                  {recipe.preset === "custom" && (
                    <div className="grid grid-cols-2 gap-2 mt-2 animate-fade-in">
                      <div>
                        <label htmlFor="custom-width-input" className="text-[10px] uppercase text-[var(--muted)] font-bold block mb-1">Width (px)</label>
                        <input 
                          id="custom-width-input"
                          type="number" 
                          min="1"
                          value={recipe.customWidth || 1920} 
                          onChange={(e) => updateRecipe({ customWidth: Number(e.target.value) })}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)] focus:outline-none focus:border-film-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-height-input" className="text-[10px] uppercase text-[var(--muted)] font-bold block mb-1">Height (px)</label>
                        <input 
                          id="custom-height-input"
                          type="number" 
                          min="1"
                          value={recipe.customHeight || 1080} 
                          onChange={(e) => updateRecipe({ customHeight: Number(e.target.value) })}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)] focus:outline-none focus:border-film-500"
                        />
                      </div>
                    </div>
                  )}

                  <FramingControl recipe={recipe} onChange={updateRecipe} />
                </div>
              </AccordionSection>

              <div className="pt-2 flex justify-center items-center gap-6">
                <button type="button" onClick={handleCopyLink} className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-widest text-film-500 hover:text-film-600 transition-all cursor-pointer">
                  <Copy size={12} />
                  {shareCopied ? "Copied!" : "Copy Link"}
                </button>
                <button type="button" onClick={resetSettings} className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)] hover:text-film-600 transition-all opacity-60 hover:opacity-100">
                  Reset all settings
                </button>
              </div>
            </div>

            <KeyboardShortcutsPanel />

            {file && (
              <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)] leading-relaxed">
                {exportSummary}
              </p>
            )}

            <button
              id="export-button"
              type="button"
              onClick={handleExport}
              disabled={!file || isProcessing}
              aria-label="Export video"
              className={cn(
                "w-full flex items-center justify-center gap-3 py-5 min-h-[44px] rounded-xl font-display text-2xl tracking-widest transition-all duration-200",
                file && !isProcessing
                  ? "bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer shadow-lg active:scale-[0.98]"
                  : "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
              )}
            >
              <Zap size={20} className={cn(status === "exporting" && "animate-spin")} />
              {status === "exporting" ? "EXPORTING..." : "EXPORT VIDEO"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}