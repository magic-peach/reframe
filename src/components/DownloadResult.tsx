"use client";

import { useState, useEffect } from "react";
import { ExportResult } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { Download, RotateCcw, Share2, Volume2, VolumeX } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import { NativeShareButton } from "./NativeShareButton";
import ExportFilenameInput from "./export/ExportFilenameInput";
import successAnim from "@/lib/lottie/success.json";
import { cn } from "@/lib/utils";
import { sanitizeFilename } from "@/utils/sanitizeFilename";

const SHARE_TWEET_TEXT =
  "I just edited my video with @reframevideo — free browser-based video editor! Check it out: https://github.com/magic-peach/reframe";

function formatExportDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds} sec`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} sec`;
}

interface Props {
  result: ExportResult;
  onReset: () => void;
  soundOnCompletion: boolean;
  onToggleSound: () => void;
}

export default function DownloadResult({ result, onReset, soundOnCompletion, onToggleSound }: Props) {
  const defaultName = `reframe_${result.width}x${result.height}`;
  const [name, setName] = useState(defaultName);

  // Validate against forbidden characters (visual feedback)
  const forbiddenCharRegex = /[<>:"/\\|?*]/;
  const containsForbiddenChars = forbiddenCharRegex.test(name);
  const isEmpty = name.trim().length === 0;
  
  // Sanitize and generate final filename
  const sanitized = sanitizeFilename(name);
  const filename = `${sanitized}.${result.format}`;
  
  // isValid: no forbidden chars and not empty, OR let sanitizeFilename handle fallback
  const isValid = !containsForbiddenChars && !isEmpty;

  const shareHref = `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TWEET_TEXT)}`;

  const [soundError, setSoundError] = useState(false);

  useEffect(() => {
    if (soundOnCompletion) {
      const audio = new Audio("/sounds/export-complete.mp3");
      audio.play().catch((error) => {
        console.error("Failed to play completion sound:", error);
        setSoundError(true);
      });
    }
  }, [soundOnCompletion]);
  const handleReset = () => {
    if (window.confirm("This will clear the current video and all settings. Continue?")) {
      onReset();
    }
  };

  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-4">
      <div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 shrink-0">
      <LottiePlayer animationData={successAnim} loop={false} autoplay />
    </div>
    <div>
      <p className="font-heading font-bold text-base text-[var(--text)]">Export complete</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">Ready to download</p>
    </div>
  </div>
  <button
    type="button"
    onClick={onToggleSound}
    aria-label={soundOnCompletion ? "Mute completion sound" : "Unmute completion sound"}
    className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--bg)] transition-colors"
    title={soundOnCompletion ? "Sound on" : "Sound off"}
  >
    {soundOnCompletion ? <Volume2 size={14} /> : <VolumeX size={14} />}
  </button>
</div>

  {soundError && (
    <p className="text-xs text-[var(--muted)]">Completion sound could not be played on this device.</p>
  )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Resolution</p>
          <p className="font-heading font-bold text-[var(--text)]">{result.width} × {result.height}</p>
        </div>
        <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">File size</p>
          <p className="font-heading font-bold text-[var(--text)]">{formatBytes(result.size)}</p>
        </div>
        {typeof result.exportDurationMs === "number" && (
          <div className="col-span-2 bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
            <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Export time</p>
            <p className="font-heading font-bold text-[var(--text)]">Exported in {formatExportDuration(result.exportDurationMs)}</p>
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-2">
        <ExportFilenameInput
          value={name}
          onChange={setName}
          fileFormat={result.format}
          maxLength={100}
          placeholder="Enter filename"
          label="Filename"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <a
          href={isValid ? result.blobUrl : undefined}
          download={isValid ? filename : undefined}
          className={cn(
            "flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-3 text-sm font-heading font-bold uppercase tracking-wide rounded-lg transition-all",
            isValid 
              ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
              : "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
          )}
          onClick={(e) => {
            if (!isValid) e.preventDefault();
          }}
        >
          <Download size={15} aria-hidden="true" />
          Download {result.format.toUpperCase()}
        </a>
        <NativeShareButton 
          file={result.blob}
          fileName={filename}
          className="flex-1 min-w-[10rem] py-3 text-sm font-heading font-bold uppercase tracking-wide rounded-lg"
        />
        <a
          href={result.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Preview video in new tab"
          className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--muted)] text-sm rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)] transition-colors"
        >
          Preview
        </a>
        <button
          type="button"
          title="Reset and upload a new video"
          aria-label="Upload a new video"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--muted)] text-sm rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] hover:text-[var(--text)] transition-colors"
        >
          <RotateCcw size={14} aria-hidden="true" />
          New
        </button>
        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (opens in a new tab)"
          className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-3 border border-[var(--border)] text-[var(--text)] text-sm font-heading font-bold uppercase tracking-wide rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
        >
          <Share2 size={15} aria-hidden="true" />
          Share on X
        </a>
      </div>
    </div>
  );
}
