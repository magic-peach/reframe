"use client";

import { useEffect } from "react";
import { ExportStatus } from "@/lib/types";
import LottiePlayer from "./LottiePlayer";
import spinnerAnim from "@/lib/lottie/spinner.json";

interface Props {
  status: ExportStatus;
  progress: number;
  onCancel: () => void;
}

export default function ExportOverlay({ status, progress, onCancel }: Props) {
  const visible = status === "loading-engine" || status === "exporting";
  const isLoading = status === "loading-engine";

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, onCancel]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div 
        className="text-center space-y-6 max-w-xs px-6 animate-fade-in" 
        aria-live="polite"
      >
        <div className="mx-auto w-20 h-20">
          <LottiePlayer 
            animationData={spinnerAnim} 
            loop 
            autoplay 
            aria-hidden="true" 
          />
        </div>

        <span className="sr-only">
          {status === 'loading-engine' ? 'Loading video engine...' : `Exporting: ${progress}%`}
        </span>

        <div>
          <h2 className="font-heading font-bold text-xl tracking-tight text-[var(--text)]">
            {isLoading ? "Loading engine" : "Exporting"}
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {isLoading
              ? "Setting up the video engine. This only happens once."
              : "Processing your video locally."}
          </p>
          <p className="text-xs font-heading font-semibold text-film-600 mt-2 uppercase tracking-wide">
            Do not close or refresh this tab
          </p>
        </div>

        {status === "exporting" && (
          <div className="w-full space-y-2">
            <div className="h-1 w-full bg-film-100 rounded-full overflow-hidden">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Export progress"
                className="h-full bg-film-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-heading font-semibold text-[var(--muted)]">
              {progress}%
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Press Escape to cancel
            </p>
          </div>
        )}
      </div>
    </div>
  );
}