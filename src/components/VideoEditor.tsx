"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import FileUpload, { type FileUploadHandle } from "./FileUpload";
import HeroSection from "./HeroSection";
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
import ImageOverlay from "./ImageOverlay";

import { cn } from "@/lib/utils";
import {
  Layers,
  Scissors,
  RotateCw,
  Volume2,
  SlidersHorizontal,
  Zap,
  AlertTriangle,
  Copy,
} from "lucide-react";

import OnboardingTour from "./OnboardingTour";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({
  icon,
  title,
  children,
  delay = 0,
}: SectionProps) {
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
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    if (isOpen) {
      contentRef.current.style.maxHeight = `${contentRef.current.scrollHeight}px`;
    } else {
      contentRef.current.style.maxHeight = `0px`;
    }
  }, [isOpen]);

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--border)] transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <span className="text-film-500 opacity-80">{icon}</span>

          <span className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
            {title}
          </span>
        </div>

        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={cn(
            "text-[var(--muted)] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        id={`${id}-panel`}
        ref={contentRef}
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: isOpen ? undefined : 0 }}
      >
        <div className="px-3 pt-3 pb-0">{children}</div>
      </div>
    </div>
  );
}

function Kbd({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[10px] font-mono text-[var(--muted)] leading-none">
      {children}
    </kbd>
  );
}

function KeyboardShortcutsPanel() {
  const [open, setOpen] = useState(false);

  const shortcuts: {
    keys: React.ReactNode[];
    label: string;
  }[] = [
    {
      keys: [
        <Kbd key="ctrl">Ctrl</Kbd>,
        <span
          key="plus1"
          className="text-[var(--muted)] text-xs"
        >
          +
        </span>,
        <Kbd key="shift">Shift</Kbd>,
        <span
          key="plus2"
          className="text-[var(--muted)] text-xs"
        >
          +
        </span>,
        <Kbd key="e">E</Kbd>,
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
      keys: [
        <Kbd key="1">1</Kbd>,
        <span
          key="dash"
          className="text-[var(--muted)] text-xs"
        >
          –
        </span>,
        <Kbd key="9">9</Kbd>,
      ],
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
          className={cn(
            "text-[var(--muted)] transition-transform duration-200",
            open && "rotate-180"
          )}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          id="keyboard-shortcuts-list"
          className="px-4 pb-3 space-y-2 border-t border-[var(--border)]"
        >
          {shortcuts.map(({ keys, label }) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 pt-2"
            >
              <span className="text-xs text-[var(--muted)]">
                {label}
              </span>

              <span className="flex items-center gap-1 shrink-0">
                {keys}
              </span>
            </li>
          ))}
        </ul>
      )}
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
    fileError,
    handleExport,
    cancelExport,
    reset,
    resetSettings,
    videoRef,
    seekTo,
    overlayFile,
    setOverlayFile,
    overlayPosition,
    setOverlayPosition,
    overlaySize,
    setOverlaySize,
    overlayOpacity,
    setOverlayOpacity,
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

  const [openSections, setOpenSections] = useState({
    resize: true,
    trim: false,
    rotation: false,
    audio: false,
    export: false,
  });

  const toggleSection = (
    key: keyof typeof openSections
  ) =>
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const downloadRef = useRef<HTMLDivElement>(null);
  const fileUploadRef = useRef<FileUploadHandle>(null);

  const hasFile = Boolean(file);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;

    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);

      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (status === "done" && downloadRef.current) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      downloadRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? "instant" : "smooth",
        block: "center",
      });
    }
  }, [status]);

  const isProcessing =
    status === "loading-engine" || status === "exporting";

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac/i.test(navigator.platform);

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
    <div
      className="min-h-screen relative flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      <ExportOverlay
        status={status}
        progress={progress}
        onCancel={cancelExport}
      />

      <OnboardingTour />

      {/* Remaining JSX stays unchanged */}
    </div>
  );
}