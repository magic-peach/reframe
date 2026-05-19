"use client";

import { useState } from "react";
import { ExportResult } from "@/lib/types";
import { formatBytes } from "@/lib/ffmpeg";
import { Download, RotateCcw, Archive } from "lucide-react";
import { zipSync } from "fflate";
import LottiePlayer from "./LottiePlayer";
import successAnim from "@/lib/lottie/success.json";

interface Props {
  result?: ExportResult | null;
  batchResults?: ExportResult[] | null;
  onReset: () => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DownloadResult({ result, batchResults, onReset }: Props) {
  const [zipBusy, setZipBusy] = useState(false);

  const isBatch = Boolean(batchResults && batchResults.length > 0);
  const items = isBatch ? batchResults! : result ? [result] : [];

  const handleZip = async () => {
    if (!batchResults?.length) return;
    setZipBusy(true);
    try {
      const files: Record<string, Uint8Array> = {};
      for (const r of batchResults) {
        const name = r.filename ?? `reframe_${r.width}x${r.height}.${r.format}`;
        const buf = await fetch(r.blobUrl).then((res) => res.arrayBuffer());
        files[name] = new Uint8Array(buf);
      }
      const zipped = zipSync(files, { level: 6 });
      downloadBlob(new Blob([zipped], { type: "application/zip" }), "reframe_batch_export.zip");
    } catch (e) {
      console.error("zip failed:", e);
    } finally {
      setZipBusy(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shrink-0">
          <LottiePlayer animationData={successAnim} loop={false} autoplay />
        </div>
        <div>
          <p className="font-heading font-bold text-base text-[var(--text)]">
            {isBatch ? "Batch export complete" : "Export complete"}
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            {isBatch ? `${items.length} files ready` : "Ready to download"}
          </p>
        </div>
      </div>

      {!isBatch && result && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
            <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Resolution</p>
            <p className="font-heading font-bold text-[var(--text)]">{result.width} x {result.height}</p>
          </div>
          <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
            <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">File size</p>
            <p className="font-heading font-bold text-[var(--text)]">{formatBytes(result.size)}</p>
          </div>
        </div>
      )}

      {isBatch && (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((r) => {
            const name = r.filename ?? `reframe_${r.width}x${r.height}.${r.format}`;
            return (
              <li
                key={r.blobUrl}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm"
              >
                <div className="min-w-0">
                  <p className="font-heading font-bold text-[var(--text)] truncate">{name}</p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {r.width}×{r.height} · {formatBytes(r.size)} · {r.format}
                  </p>
                </div>
                <a
                  href={r.blobUrl}
                  download={name}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-film-600 hover:bg-film-700 text-white text-xs font-heading font-bold uppercase tracking-wide rounded-lg transition-all"
                >
                  <Download size={14} />
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        {!isBatch && result && (
          <a
            href={result.blobUrl}
            download={result.filename ?? `reframe_${result.width}x${result.height}.${result.format}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-film-600 hover:bg-film-700 text-white text-sm font-heading font-bold uppercase tracking-wide rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Download size={15} />
            Download {result.format.toUpperCase()}
          </a>
        )}

        {isBatch && batchResults && batchResults.length > 1 && (
          <button
            type="button"
            disabled={zipBusy}
            onClick={handleZip}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-film-600 hover:bg-film-700 disabled:opacity-60 text-white text-sm font-heading font-bold uppercase tracking-wide rounded-lg transition-all"
          >
            <Archive size={15} />
            {zipBusy ? "Zipping…" : "Download ZIP"}
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] text-[var(--muted)] text-sm rounded-lg hover:bg-[var(--bg)] transition-colors sm:shrink-0"
        >
          <RotateCcw size={14} />
          New
        </button>
      </div>
    </div>
  );
}
