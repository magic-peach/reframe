"use client";

import { ExportStatus } from "@/lib/types";
import LottiePlayer from "./LottiePlayer";
import spinnerAnim from "@/lib/lottie/spinner.json";

interface Props {
  status: ExportStatus;
  progress: number;
}

export default function ExportOverlay({ status, progress }: Props) {
  const visible = status === "loading-engine" || status === "exporting";
  if (!visible) return null;

  const isLoading = status === "loading-engine";

  return (
    // full-screen fixed overlay blocks all interaction while ffmpeg runs
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="text-center space-y-6 max-w-xs px-6">

        {/* lottie spinner */}
        <div className="mx-auto w-20 h-20">
          <LottiePlayer animationData={spinnerAnim} loop autoplay />
        </div>

        <div>
          <h2 className="font-heading font-bold text-xl tracking-tight text-[var(--text)]">
            {isLoading ? "Loading engine" : "Exporting"}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {isLoading
              ? "Downloading ffmpeg core (~30 MB). One-time only."
              : "Processing your video in the browser."}
          </p>
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

        <p className="text-xs text-[var(--muted)]">
          Everything stays on your device. No uploads, no servers.
        </p>
      </div>
    </div>
  );
}
