"use client";

import FocusTrap from "focus-trap-react";
import { useEffect, useRef, useCallback } from "react";
import { ExportStatus } from "@/lib/types";
import LottiePlayer from "./LottiePlayer";
import spinnerAnim from "@/lib/lottie/spinner.json";

interface Props {
  status: ExportStatus;
  progress: number;
  onCancel?: () => void;
}

export default function ExportOverlay({ status, progress, onCancel }: Props) {
  const visible = status === "loading-engine" || status === "exporting";
  const isLoading = status === "loading-engine";

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusAnchorRef = useRef<HTMLDivElement | null>(null);
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key === "Escape") {
    onCancel?.();
  }
}, [onCancel]);
  useEffect(() => {
  if (!visible) return;

  window.addEventListener("keydown", handleKeyDown);

  previousFocusRef.current =
    document.activeElement as HTMLElement;

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [visible, handleKeyDown]);

  useEffect(() => {
    if (!visible && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, onCancel]);

  if (!visible) return null;

  return (
    <FocusTrap
      active={visible}
      focusTrapOptions={{
        escapeDeactivates: true,
        clickOutsideDeactivates: false,
        initialFocus: () => focusAnchorRef.current!,
        fallbackFocus: () => focusAnchorRef.current!,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
      >
        <div
          className="text-center space-y-6 max-w-xs px-6 animate-fade-in"
          aria-live="polite"
        >

          <div
            ref={focusAnchorRef}
            tabIndex={-1}
            className="sr-only"
            aria-hidden="true"
          />

          <div className="mx-auto w-20 h-20">
            <LottiePlayer
              animationData={spinnerAnim}
              loop
              autoplay
              aria-hidden="true"
            />
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
            <p className="text-xs font-heading font-semibold text-[var(--muted)] text-film-600 mt-2 uppercase tracking-wide">
              Do not close or refresh this tab
            </p>
          </div>

          <span className="sr-only">
            {status === "loading-engine"
              ? "Loading video engine..."
              : `Exporting: ${progress}%`}
          </span>


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

              <div className="flex flex-col items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => onCancel?.()}
                  className="
          inline-flex items-center justify-center
          rounded-lg
          border border-red-200
          bg-red-50
          px-4 py-2
          text-sm font-semibold text-red-600
          transition-colors
          hover:bg-red-100
          active:scale-[0.98]
        "
                >
                  Cancel Export
                </button>

                <p className="text-gray-500 text-xs">
                  Press Escape to cancel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </FocusTrap >
  );
}