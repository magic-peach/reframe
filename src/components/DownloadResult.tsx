"use client";

import { useEffect, useRef } from "react"; // 👈 Added for focus management
import { ExportResult } from "@/lib/types";
import { formatBytes } from "@/lib/ffmpeg";
import { Download, RotateCcw } from "lucide-react";
import LottiePlayer from "./LottiePlayer";
import successAnim from "@/lib/lottie/success.json";

interface Props {
  result: ExportResult;
  onReset: () => void;
}

export default function DownloadResult({ result, onReset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const filename = `reframe_${result.width}x${result.height}.${result.format}`;

  // Accessibility: Focus the result container when it appears
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div 
      ref={containerRef}
      tabIndex={-1} // 👈 Makes the div focusable via script
      role="region" // 👈 Marks this as a significant area
      aria-live="assertive" // 👈 Forces screen reader to announce "Export complete" immediately
      aria-labelledby="result-header"
      className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-4 outline-none focus:ring-2 focus:ring-film-400"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shrink-0" aria-hidden="true"> {/* Hide animation from SR */}
          <LottiePlayer animationData={successAnim} loop={false} autoplay />
        </div>
        <div>
          <p id="result-header" className="font-heading font-bold text-base text-[var(--text)]">
            Export complete
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Ready to download</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Resolution</p>
          <p className="font-heading font-bold text-[var(--text)]" aria-label={`Resolution: ${result.width} by ${result.height}`}>
            {result.width} x {result.height}
          </p>
        </div>
        <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">File size</p>
          <p className="font-heading font-bold text-[var(--text)]" aria-label={`File size: ${formatBytes(result.size)}`}>
            {formatBytes(result.size)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={result.blobUrl}
          download={filename}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-film-600 hover:bg-film-700 text-white text-sm font-heading font-bold uppercase tracking-wide rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99] focus:ring-2 focus:ring-offset-2 focus:ring-film-600 outline-none"
        >
          <Download size={15} />
          Download {result.format.toUpperCase()}
        </a>
        <button
          type="button"
          onClick={onReset}
          aria-label="Start a new video project"
          className="flex items-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--muted)] text-sm rounded-lg hover:bg-[var(--bg)] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border)] outline-none"
        >
          <RotateCcw size={14} />
          New
        </button>
      </div>
    </div>
  );
}