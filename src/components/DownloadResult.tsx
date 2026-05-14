"use client";

import { ExportResult } from "@/lib/types";
import { formatBytes } from "@/lib/ffmpeg";
import { Download, RotateCcw, Share2 } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import successAnim from "@/lib/lottie/success.json";

const SHARE_TWEET_TEXT =
  "I just edited my video with @reframevideo — free browser-based video editor! Check it out: https://github.com/magic-peach/reframe";

interface Props {
  result: ExportResult;
  onReset: () => void;
}

export default function DownloadResult({ result, onReset }: Props) {
  const filename = `reframe_${result.width}x${result.height}.${result.format}`;
  const shareHref = `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TWEET_TEXT)}`;

  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shrink-0">
          <LottiePlayer animationData={successAnim} loop={false} autoplay />
        </div>
        <div>
          <p className="font-heading font-bold text-base text-[var(--text)]">Export complete</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Ready to download</p>
          <p className="text-sm text-[var(--text)]">
            Resolution: {result.width} × {result.height}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Resolution</p>
          <p className="font-heading font-bold text-[var(--text)]">{result.width} x {result.height}</p>
        </div>
        <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">File size</p>
          <p className="font-heading font-bold text-[var(--text)]">{formatBytes(result.size)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={result.blobUrl}
          download={filename}
          className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-3 bg-film-600 hover:bg-film-700 text-white text-sm font-heading font-bold uppercase tracking-wide rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Download size={15} />
          Download {result.format.toUpperCase()}
        </a>
        <button
          type="button"
          title="Reset and upload a new video"
          aria-label="Upload a new video"
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--muted)] text-sm rounded-lg hover:bg-[var(--bg)] transition-colors"
        >
          <RotateCcw size={14} />
          New
        </button>
        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (opens in a new tab)"
          className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-3 border border-[var(--border)] text-[var(--text)] text-sm font-heading font-bold uppercase tracking-wide rounded-lg hover:bg-[var(--bg)] transition-colors"
        >
          <Share2 size={15} aria-hidden="true" />
          Share on X
        </a>
      </div>
    </div>
  );
}
