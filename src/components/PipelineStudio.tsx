"use client";

import { useState, useRef, useEffect } from "react";
import { loadFFmpeg } from "@/lib/ffmpeg";
import { runPipeline, PipelineResult } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import {
  Code,
  Terminal as TerminalIcon,
  Play,
  Square,
  Download,
  AlertCircle,
  CheckCircle2,
  FolderArchive,
  RefreshCw,
  Copy,
  ChevronDown
} from "lucide-react";

interface Props {
  file: File | null;
}

const PRESETS = [
  {
    id: "dataset-prep",
    name: "🤖 AI Dataset Prep (Transparent WebP Frames)",
    description: "Extract frames, remove green screen backgrounds, scale to 512x512, and export as highly optimized WebP images.",
    code: `name: "AI Dataset Preprocessing"
pipeline:
  - step: extract_frames
    fps: 2
    format: webp
  - step: remove_background
    color: green
    similarity: 0.18
  - step: resize
    width: 512
    height: 512
  - step: convert
    format: webp
`,
  },
  {
    id: "green-screen-video",
    name: "🟢 Green Screen Removal (WebM Alpha Video)",
    description: "Trim the first 10 seconds of a video, remove green background, and convert to WebM with alpha transparency.",
    code: `name: "Chroma Key transparent Video"
pipeline:
  - step: trim
    start: 0
    end: 10
  - step: remove_background
    color: green
    similarity: 0.15
    blend: 0.05
  - step: convert
    format: webm
`,
  },
  {
    id: "frame-extractor",
    name: "📸 Batch Frame Extractor (High-Res JPEG)",
    description: "Simply extract high-resolution JPEG frames at 5 frames per second across the video timeline.",
    code: `name: "Batch Frame Extractor"
pipeline:
  - step: extract_frames
    fps: 5
    format: jpeg
`,
  },
  {
    id: "square-mp4",
    name: "⏹️ Social Media Square Cover (Crop & Convert)",
    description: "Resize/crop the video to 600x600 square framing, convert to MP4 format with standard settings.",
    code: `name: "Square MP4 Transcoder"
pipeline:
  - step: resize
    width: 600
    height: 600
    fit: cover
  - step: convert
    format: mp4
`,
  },
];

export default function PipelineStudio({ file }: Props) {
  const [configText, setConfigText] = useState(PRESETS[0].code);
  const [selectedPresetId, setSelectedPresetId] = useState(PRESETS[0].id);
  const [status, setStatus] = useState<"idle" | "loading-engine" | "running" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handlePresetSelect = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) {
      setConfigText(preset.code);
      setSelectedPresetId(id);
    }
  };

  const startPipeline = async () => {
    if (!file) return;

    setStatus("loading-engine");
    setProgress(0);
    setLogs([]);
    setResult(null);
    setErrorMsg(null);

    abortControllerRef.current = new AbortController();

    addLog(`[${new Date().toLocaleTimeString()}] 🎬 Loading client-side FFmpeg WebAssembly engine...`);
    try {
      const ffmpeg = await loadFFmpeg(abortControllerRef.current.signal);
      
      setStatus("running");
      const pipelineResult = await runPipeline(
        ffmpeg,
        file,
        configText,
        (msg) => addLog(msg),
        (pct) => setProgress(pct)
      );

      setResult(pipelineResult);
      setStatus("done");
    } catch (e) {
      if (status === "loading-engine" || status === "running") {
        const errorText = e instanceof Error ? e.message : String(e);
        addLog(`[ERROR] ${errorText}`);
        setErrorMsg(errorText);
        setStatus("error");
      }
    }
  };

  const stopPipeline = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    addLog(`[${new Date().toLocaleTimeString()}] 🛑 Execution aborted by user.`);
    setStatus("idle");
    setProgress(0);
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Card */}
      <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-film-500/10 text-film-500 font-heading text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl-lg">
          Pipeline Studio
        </div>
        <h2 className="font-display text-2xl tracking-widest text-[var(--text)] mb-2">AUTOMATED PRESETS STUDIO</h2>
        <p className="text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
          Create, edit, and execute multi-step media preprocessing workflows locally. Specify options in standard YAML or JSON and watch the steps process sequentially in the secure client-side sandbox.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Script / Config Editor */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col h-[520px] shadow-sm">
            {/* Header controls */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-film-500" />
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Workflow YAML</span>
              </div>
              <div className="relative inline-block text-left">
                <select
                  value={selectedPresetId}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs font-semibold px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-film-500 cursor-pointer text-[var(--text)]"
                >
                  {PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.substring(3)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none text-[var(--muted)]" />
              </div>
            </div>

            {/* Selected preset description */}
            <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg text-xs text-[var(--muted)] mb-4 leading-normal">
              {PRESETS.find((p) => p.id === selectedPresetId)?.description}
            </div>

            {/* Code area with line numbers */}
            <div className="flex-1 flex bg-[#0d0d0d] rounded-lg border border-[var(--border)] overflow-hidden font-mono text-xs text-[#a6accd] relative">
              <div className="w-10 bg-[#070708] border-r border-[#1a1a1c] py-4 select-none text-right pr-2 text-gray-600 flex flex-col gap-0.5">
                {Array.from({ length: configText.split("\n").length }).map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                disabled={status === "loading-engine" || status === "running"}
                spellCheck="false"
                className="flex-1 bg-transparent py-4 px-3 outline-none resize-none overflow-y-auto leading-normal whitespace-pre text-[#e2e8f0]"
                style={{ caretColor: "var(--film-500)" }}
              />
            </div>

            {/* Run Button Row */}
            <div className="pt-4 mt-2 flex gap-3 border-t border-[var(--border)]">
              {status === "idle" || status === "done" || status === "error" ? (
                <button
                  onClick={startPipeline}
                  disabled={!file}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-heading font-bold text-xs uppercase tracking-wider transition-all duration-200",
                    file
                      ? "bg-film-600 hover:bg-film-700 text-white shadow-md cursor-pointer hover:scale-[1.01]"
                      : "bg-[var(--border)] text-[var(--muted)] opacity-50 cursor-not-allowed"
                  )}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Pipeline
                </button>
              ) : (
                <button
                  onClick={stopPipeline}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-heading font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop Execution
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Console Output & Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#070709] border border-[var(--border)] rounded-xl p-5 flex flex-col h-[520px] shadow-sm relative overflow-hidden">
            {/* Glass glow background effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-film-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header controls */}
            <div className="flex items-center justify-between border-b border-[#1a1a1f] pb-4 mb-4 z-10">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-film-400" />
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-[#a6accd]">Execution Terminal</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyLogs}
                  disabled={logs.length === 0}
                  className="text-xs font-heading font-bold text-[#a6accd] hover:text-film-400 disabled:opacity-30 flex items-center gap-1.5 cursor-pointer bg-[#121217] border border-[#1a1a23] rounded-lg px-2.5 py-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied" : "Copy Logs"}
                </button>
              </div>
            </div>

            {/* Terminal logs window */}
            <div className="flex-1 bg-[#09090d] border border-[#1a1a23] rounded-lg p-4 font-mono text-[11px] overflow-y-auto leading-normal space-y-1.5 text-[#cad3f5] relative shadow-inner">
              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-10">
                  <TerminalIcon className="w-10 h-10 text-gray-700 animate-pulse mb-3" />
                  <p className="font-sans font-medium text-xs">Terminal is waiting for pipeline launch...</p>
                  <p className="font-sans text-[10px] opacity-75 mt-1">Select a workflow preset and click Run Pipeline</p>
                </div>
              )}
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap select-all font-mono",
                    log.includes("[ERROR]") && "text-red-400 font-semibold",
                    log.includes("[SUCCESS]") && "text-emerald-400 font-semibold",
                    log.includes("🚀") && "text-film-400 font-semibold",
                    log.includes("⚙️") && "text-blue-400",
                    log.includes("[FFmpeg]") && "text-gray-500 pl-4 border-l border-gray-800"
                  )}
                >
                  {log}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>

            {/* Progress / Status Footer */}
            {(status === "loading-engine" || status === "running") && (
              <div className="pt-4 border-t border-[#1a1a1f] space-y-2.5 z-10 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-semibold text-[#a6accd]">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin text-film-500" />
                    {status === "loading-engine" ? "Bootstrapping FFmpeg.wasm..." : "Processing steps..."}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#121217] rounded-full overflow-hidden border border-[#1a1a24]">
                  <div
                    className="h-full bg-gradient-to-r from-film-600 to-film-400 rounded-full transition-all duration-300 shadow-md shadow-film-500/20"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Result Hub */}
            {status === "done" && result && (
              <div className="pt-4 border-t border-[#1a1a1f] animate-fade-in z-10">
                <div className="bg-[#0f1915] border border-emerald-950/50 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                      {result.isZip ? (
                        <FolderArchive className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-emerald-100">
                        {result.isZip ? "Dataset package ready!" : "Process finished!"}
                      </h4>
                      <p className="text-[10px] text-emerald-400/70 mt-0.5">
                        {result.isZip
                          ? `ZIP archive generated with ${result.filesCount ?? 0} media assets`
                          : "Transcoded video file exported successfully"}
                      </p>
                    </div>
                  </div>
                  <a
                    href={result.blobUrl}
                    download={result.filename}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-wider rounded-lg px-4 py-2.5 transition-all shadow-md shadow-emerald-950/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            )}

            {/* Error Hub */}
            {status === "error" && errorMsg && (
              <div className="pt-4 border-t border-[#1a1a1f] animate-fade-in z-10">
                <div className="bg-[#1c0f0f] border border-red-950/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-red-100">
                      Step execution failed
                    </h4>
                    <p className="text-[10px] text-red-400/80 mt-1 max-h-[50px] overflow-y-auto font-mono whitespace-pre-wrap select-text leading-relaxed">
                      {errorMsg}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
