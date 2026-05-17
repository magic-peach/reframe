"use client";

import FocusTrap from "focus-trap-react";
import { useEffect, useRef, useCallback } from "react";
import { ExportStatus } from "@/lib/types";
import LottiePlayer from "./LottiePlayer";
import spinnerAnim from "@/lib/lottie/spinner.json";

interface Props {
  status: ExportStatus;
  progress: number;
  progressMessage?: string;
  onCancel?: () => void;
}

export default function ExportOverlay({
  status,
  progress,
  progressMessage,
  onCancel,
}: Props) {
  const visible = status === "loading-engine" || status === "exporting";
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusAnchorRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel?.();
      }
    },
    [onCancel],
  );

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("keydown", handleKeyDown);
    previousFocusRef.current = document.activeElement as HTMLElement;
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleKeyDown]);

  useEffect(() => {
    if (!visible && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [visible]);

  if (!visible) return null;

  const isLoading = status === "loading-engine";
  const progressValue = Math.max(0, Math.min(100, Math.round(progress)));
  const helperText =
    isLoading && progressValue > 0
      ? `${progressMessage || "Downloading video engine"} (${progressValue}%)...`
      : isLoading
        ? progressMessage ||
          "Setting up the video engine. This only happens once."
        : "Processing your video locally.";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="animate-fade-in max-w-xs space-y-6 px-6 text-center">
        <div className="mx-auto h-20 w-20">
          <LottiePlayer animationData={spinnerAnim} loop autoplay />
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-[var(--text)]">
            {isLoading ? "Loading engine" : "Exporting"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{helperText}</p>
          <p className="font-heading text-film-600 mt-2 text-xs font-semibold uppercase tracking-wide">
            Do not close or refresh this tab
          </p>
        </div>

        {progressValue > 0 && (
          <div className="w-full space-y-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-film-100">
              <div
                className="bg-film-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <p className="font-heading text-xs font-semibold text-[var(--muted)]">
              {progressValue}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
