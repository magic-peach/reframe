"use client";

import { ExportStatus, BatchExportProgress } from "@/lib/types";
import LottiePlayer from "./LottiePlayer";
import spinnerAnim from "@/lib/lottie/spinner.json";

interface Props {
  status: ExportStatus;
  progress: number;
  batchProgress: BatchExportProgress | null;
  onCancel?: () => void;
}

export default function ExportOverlay({ status, progress, batchProgress, onCancel }: Props) {
  const visible = status === "loading-engine" || status === "exporting";
  if (!visible) return null;

  const isLoading = status === "loading-engine";
  const showCancel = (status === "exporting" || status === "loading-engine") && typeof onCancel === "function";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="text-center space-y-6 max-w-md px-6 animate-fade-in">

        <div className="mx-auto w-20 h-20">
          <LottiePlayer animationData={spinnerAnim} loop autoplay />
        </div>

        <div>
          <h2 className="font-heading font-bold text-xl tracking-tight text-[var(--text)]">
            {isLoading ? "Loading engine" : "Exporting"}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {isLoading
              ? "Setting up the video engine. This only happens once."
              : "Processing your video locally."}
          </p>
          {batchProgress && (
            <p className="text-sm font-heading font-semibold text-film-700 mt-3">
              Export {batchProgress.current} of {batchProgress.total}: {batchProgress.filename}
            </p>
          )}
          <p className="text-xs font-heading font-semibold text-film-600 mt-2 uppercase tracking-wide">
            Do not close or refresh this tab
          </p>
        </div>

        {status === "exporting" && (
          <div className="w-full space-y-2">
            <div className="h-1 w-full bg-film-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-film-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-heading font-semibold text-[var(--muted)]">
              {progress}%
            </p>
          </div>
        )}

        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg border border-[var(--border)] text-sm font-heading font-bold uppercase tracking-wide text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            Cancel export
          </button>
        )}
      </div>
    </div>
  );
}
