"use client";

import { formatBytes } from "@/lib/utils";
import { ExportHistoryItem } from "@/lib/types";
import { Download, Clock3, AlertTriangle } from "lucide-react";

interface Props {
  history: ExportHistoryItem[];
  onDownload: (item: ExportHistoryItem) => void;
}

export default function ExportHistory({ history, onDownload }: Props) {
  if (!history.length) {
    return (
      <div className="p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">
        No export history yet. Once you export a video, the last 5 exports will appear here.
      </div>
    );
  }

  return (
    <div className="p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-heading font-semibold uppercase tracking-widest text-[var(--muted)]">
            Export history
          </p>
          <p className="text-[13px] text-[var(--text)]">Last {history.length} exports in this session</p>
        </div>
        <span className="inline-flex items-center gap-1 text-[var(--muted)] text-xs uppercase tracking-[0.2em]">
          <Clock3 size={14} /> Session
        </span>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="border border-[var(--border)] rounded-2xl p-3 bg-[var(--bg)]">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {item.format.toUpperCase()} • {formatBytes(item.size)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {item.width} × {item.height} • {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button
                type="button"
                disabled={!item.blobUrl}
                onClick={() => onDownload(item)}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:text-[var(--muted)] disabled:bg-[var(--surface)]"
              >
                <Download size={14} />
                {item.blobUrl ? "Download" : "Unavailable"}
              </button>
            </div>
            {item.usedFallback && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-[11px] font-medium text-yellow-800">
                <AlertTriangle size={14} /> WebM fallback used
              </div>
            )}
            {item.warning && !item.usedFallback && (
              <p className="mt-2 text-[11px] text-yellow-800">{item.warning}</p>
            )}
            {item.warning && item.usedFallback && (
              <p className="mt-2 text-[11px] text-yellow-800">{item.warning}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
