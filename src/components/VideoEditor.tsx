"use client";

import { useVideoEditor } from "@/hooks/useVideoEditor";
import FileUpload from "./FileUpload";
import VideoPreview from "./VideoPreview";
import PresetSelector from "./PresetSelector";
import FramingControl from "./FramingControl";
import TrimControl from "./TrimControl";
import RotateControl from "./RotateControl";
import AudioSpeedControl from "./AudioSpeedControl";
import ExportSettings from "./ExportSettings";
import ExportOverlay from "./ExportOverlay";
import DownloadResult from "./DownloadResult";
import { Zap, AlertCircle } from "lucide-react";

// wraps each settings section in a consistent card
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
      {children}
    </div>
  );
}

export default function VideoEditor() {
  const {
    file,
    recipe,
    status,
    progress,
    result,
    error,
    updateRecipe,
    handleFileSelect,
    handleExport,
    reset,
  } = useVideoEditor();

  const isProcessing = status === "loading-engine" || status === "exporting";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-50">
      <ExportOverlay status={status} progress={progress} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            🎬 Video Editor
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Resize, trim, and export — all in your browser. No uploads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* left: upload + preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <FileUpload onFileSelect={handleFileSelect} currentFile={file} />
              {file && (
                <div className="mt-4">
                  <VideoPreview file={file} />
                </div>
              )}
            </div>

            {status === "error" && error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Export failed</p>
                  <p className="text-red-500 text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* download panel shows up after a succesful export */}
            {status === "done" && result && (
              <DownloadResult result={result} onReset={reset} />
            )}
          </div>

          {/* right: all controls */}
          <div className={`space-y-5 ${isProcessing ? "pointer-events-none opacity-60" : ""}`}>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-6">
              <Section title="Output size">
                <PresetSelector recipe={recipe} onChange={updateRecipe} />
              </Section>

              <hr className="border-gray-100" />

              <Section title="Framing">
                <FramingControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <hr className="border-gray-100" />

              <Section title="Trim">
                <TrimControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <hr className="border-gray-100" />

              <Section title="Rotate">
                <RotateControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <hr className="border-gray-100" />

              <Section title="Audio & Speed">
                <AudioSpeedControl recipe={recipe} onChange={updateRecipe} />
              </Section>

              <hr className="border-gray-100" />

              <Section title="Export quality">
                <ExportSettings recipe={recipe} onChange={updateRecipe} />
              </Section>
            </div>

            <button
              onClick={handleExport}
              disabled={!file || isProcessing}
              className={`
                w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                text-base font-semibold transition-all
                ${file && !isProcessing
                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 active:scale-[0.98]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              <Zap size={18} />
              {isProcessing ? "Processing…" : "Export video"}
            </button>

            <p className="text-center text-xs text-gray-400 px-4">
              First export downloads the ffmpeg engine (~30 MB). Subsequent exports are instant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
