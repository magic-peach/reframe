"use client";

import { ExportStatus } from "@/lib/types";

interface Props {
  status: ExportStatus;
  progress: number;
}

export default function ExportOverlay({ status, progress }: Props) {
  const isVisible = status === "loading-engine" || status === "exporting";

  if (!isVisible) return null;

  const message =
    status === "loading-engine"
      ? "Loading engine… (~30 MB, first time only)"
      : "Exporting your video…";

  return (
    // fixed overlay blocks all interaction while ffmpeg is running
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="text-center space-y-6 max-w-sm px-6">
        {/* spinning ring */}
        <div className="mx-auto w-16 h-16 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />

        <div>
          <h2 className="text-lg font-semibold text-gray-800">{message}</h2>
          <p className="text-sm text-red-500 mt-1 font-medium">
            ⚠️ Do not close or refresh this tab
          </p>
        </div>

        {status === "exporting" && (
          <div className="w-full space-y-2">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{progress}% done</p>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Processing happens entirely in your browser. No uploads, no servers.
        </p>
      </div>
    </div>
  );
}
