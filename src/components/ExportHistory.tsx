"use client";

import { useState } from "react";

interface ExportHistoryItem {
  id: string;
  blobUrl: string;
  filename: string;
  format: string;
  size: number;
  width: number;
  height: number;
  exportedAt: number;
}

interface ExportHistoryProps {
  history: ExportHistoryItem[];
  onClear: () => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportHistory({
  history,
  onClear,
}: ExportHistoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!history.length) return null;

  const handleDownload = (item: ExportHistoryItem) => {
    const link = document.createElement("a");

    link.href = item.blobUrl;
    link.download = item.filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-6 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 text-left"
        >
          <h3 className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
            Recent Exports
          </h3>

          <span className="text-xs text-[var(--muted)]">
            {isOpen ? "▲" : "▼"}
          </span>
        </button>

        <button
          type="button"
          onClick={onClear}
          className="
            px-3 py-1.5
            rounded-lg
            border border-[var(--border)]
            bg-[var(--surface)]
            text-xs font-heading font-bold uppercase tracking-widest
            text-[var(--muted)]
            hover:border-film-500
            hover:text-film-500
            transition-all
          "
        >
          Clear History
        </button>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)] opacity-70">
        History is cleared when you close or refresh the page.
      </p>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="
                flex flex-col gap-4
                rounded-xl
                border border-[var(--border)]
                bg-[var(--surface)]
                p-4
                md:flex-row
                md:items-center
                md:justify-between
              "
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text)]">
                  {item.filename}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <span>{item.format.toUpperCase()}</span>

                  <span>•</span>

                  <span>
                    {item.width}×{item.height}
                  </span>

                  <span>•</span>

                  <span>{formatFileSize(item.size)}</span>
                </div>

                <p className="mt-2 text-xs text-[var(--muted)] opacity-70">
                  Exported{" "}
                  {new Date(item.exportedAt).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(item)}
                className="
                  px-4 py-2
                  rounded-lg
                  bg-film-600
                  hover:bg-film-700
                  text-white
                  text-sm font-semibold
                  transition-all
                  active:scale-[0.98]
                  whitespace-nowrap
                "
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}