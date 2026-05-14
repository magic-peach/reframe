"use client";

import { useEffect, useRef } from "react"; // 👈 Add these
import { ExportStatus } from "@/lib/types";
import LottiePlayer from "./LottiePlayer";
import spinnerAnim from "@/lib/lottie/spinner.json";

interface Props {
  status: ExportStatus;
  progress: number;
}

export default function ExportOverlay({ status, progress }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null); // 👈 Create the ref
  const visible = status === "loading-engine" || status === "exporting";

  // Handle Focus for Accessibility
  useEffect(() => {
    if (visible && overlayRef.current) {
      // 1. Move focus to the modal so screen readers read it
      overlayRef.current.focus();

      // 2. Prevent tabbing out of the modal
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          e.preventDefault(); // Lock focus since there are no buttons to click
        }
      };

      window.addEventListener("keydown", handleTab);
      return () => window.removeEventListener("keydown", handleTab);
    }
  }, [visible]);

  if (!visible) return null;

  const isLoading = status === "loading-engine";

  return (
    <div
      ref={overlayRef} // 👈 Attach ref
      tabIndex={-1}    // 👈 Make it focusable via code
      role="dialog"    // 👈 Accessibility Role
      aria-modal="true" // 👈 Tells browsers it's a modal
      aria-labelledby="export-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm outline-none"
    >
      <div className="text-center space-y-6 max-w-xs px-6 animate-fade-in">
        <div className="mx-auto w-20 h-20">
          <LottiePlayer animationData={spinnerAnim} loop autoplay />
        </div>

        <div>
          <h2 id="export-title" className="font-heading font-bold text-xl tracking-tight text-[var(--text)]">
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
                className="h-full bg-film-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-heading font-semibold text-[var(--muted)]">
              {progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}