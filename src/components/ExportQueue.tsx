"use client";

import { COMPRESSION_MODE_OPTIONS } from "@/lib/constants";
import { formatBytes } from "@/lib/ffmpeg";
import { getPresetById } from "@/lib/presets";
import { ExportQueueItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock3,
  Download,
  ListVideo,
  Play,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

interface Props {
  items: ExportQueueItem[];
  activeId: string | null;
  isProcessing: boolean;
  onStart: () => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onClear: () => void;
}

function getTargetSize(item: ExportQueueItem) {
  if (item.recipe.preset === "custom") {
    return `${item.recipe.customWidth}x${item.recipe.customHeight}`;
  }

  const preset = getPresetById(item.recipe.preset);
  return `${preset?.width ?? 1920}x${preset?.height ?? 1080}`;
}

function getCompressionLabel(item: ExportQueueItem) {
  return (
    COMPRESSION_MODE_OPTIONS.find(
      (option) => option.id === item.recipe.compressionMode
    )?.label ?? "Custom"
  );
}

function getStatusMeta(item: ExportQueueItem) {
  switch (item.status) {
    case "done":
      return {
        icon: CheckCircle2,
        label: "Done",
        className: "text-green-600",
      };
    case "error":
      return {
        icon: XCircle,
        label: "Error",
        className: "text-red-500",
      };
    case "cancelled":
      return {
        icon: XCircle,
        label: "Cancelled",
        className: "text-[var(--muted)]",
      };
    case "loading-engine":
      return {
        icon: Clock3,
        label: "Loading",
        className: "text-film-600",
      };
    case "exporting":
      return {
        icon: Clock3,
        label: `${item.progress}%`,
        className: "text-film-600",
      };
    default:
      return {
        icon: Clock3,
        label: "Queued",
        className: "text-[var(--muted)]",
      };
  }
}

export default function ExportQueue({
  items,
  activeId,
  isProcessing,
  onStart,
  onRemove,
  onRetry,
  onClear,
}: Props) {
  const queuedCount = items.filter((item) => item.status === "queued").length;

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListVideo size={14} className="text-film-500" />
          <h3 className="text-[10px] font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
            Export queue
          </h3>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[9px] font-heading font-bold uppercase tracking-widest text-[var(--muted)] hover:text-film-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] p-4 text-center">
          <p className="text-xs font-heading font-semibold text-[var(--muted)]">
            No queued exports
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onStart}
            disabled={queuedCount === 0 || isProcessing}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5",
              "text-xs font-heading font-bold uppercase tracking-wide transition-all",
              queuedCount > 0 && !isProcessing
                ? "bg-[var(--text)] text-[var(--surface)] hover:opacity-90 active:scale-[0.99]"
                : "bg-[var(--border)] text-[var(--muted)] opacity-60 cursor-not-allowed"
            )}
          >
            <Play size={13} />
            Start {queuedCount > 0 ? queuedCount : ""} queued
          </button>

          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {items.map((item) => {
              const meta = getStatusMeta(item);
              const StatusIcon = meta.icon;
              const outputSize = item.result
                ? `${item.result.width}x${item.result.height}`
                : getTargetSize(item);
              const filename = `reframe_${outputSize}.${item.result?.format ?? item.recipe.format}`;
              const isActive = activeId === item.id;
              const canRemove = !isActive;
              const canRetry =
                item.status === "error" || item.status === "cancelled";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-3 bg-[var(--bg)] space-y-2",
                    isActive ? "border-film-300" : "border-[var(--border)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="truncate text-xs font-heading font-bold text-[var(--text)]"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5">
                        {getTargetSize(item)} / {item.recipe.format.toUpperCase()} / {getCompressionLabel(item)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1 text-[10px] font-heading font-bold uppercase tracking-wide",
                        meta.className
                      )}
                    >
                      <StatusIcon size={11} />
                      {meta.label}
                    </div>
                  </div>

                  {(item.status === "exporting" || item.status === "loading-engine") && (
                    <div className="h-1 w-full bg-film-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-film-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${item.status === "loading-engine" ? 8 : item.progress}%`,
                        }}
                      />
                    </div>
                  )}

                  {item.error && (
                    <p className="text-[10px] leading-snug text-red-500">
                      {item.error}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {item.result && (
                      <>
                        <a
                          href={item.result.blobUrl}
                          download={filename}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-film-600 px-3 py-2 text-[10px] font-heading font-bold uppercase tracking-wide text-white hover:bg-film-700 transition-colors"
                        >
                          <Download size={12} />
                          {formatBytes(item.result.size)}
                        </a>
                        <a
                          href={item.result.blobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-[var(--border)] px-3 py-2 text-[10px] font-heading font-bold uppercase tracking-wide text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
                        >
                          Preview
                        </a>
                      </>
                    )}

                    {canRetry && (
                      <button
                        type="button"
                        onClick={() => onRetry(item.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-2 text-[10px] font-heading font-bold uppercase tracking-wide text-[var(--muted)] hover:bg-[var(--surface)] transition-colors"
                      >
                        <RotateCcw size={12} />
                        Retry
                      </button>
                    )}

                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        title="Remove from queue"
                        aria-label={`Remove ${item.file.name} from export queue`}
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-film-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
