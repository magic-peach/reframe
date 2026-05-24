"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  previewUrl: string | null;
  isPreviewing: boolean;
  onPreview: () => void;
  isDisabled: boolean;
}

export default function PreviewPanel({
  previewUrl,
  isPreviewing,
  onPreview,
  isDisabled,
}: PreviewPanelProps) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
          Preview Frame
        </h3>
        <button
          type="button"
          onClick={onPreview}
          disabled={isDisabled || isPreviewing}
          aria-label="Generate preview frame"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            isDisabled || isPreviewing
              ? "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
              : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <Eye size={16} />
          {isPreviewing ? "Generating..." : "Preview"}
        </button>
      </div>

      {isPreviewing && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-sm text-[var(--muted)]">Generating preview...</p>
          </div>
        </div>
      )}

      {!isPreviewing && previewUrl && (
        <div className="rounded-lg overflow-hidden border border-[var(--border)]">
          <Image
            src={previewUrl}
            alt="Preview frame"
            aria-label="Generated preview frame"
            width={0}
            height={0}
            sizes="100vw"
            className="w-full h-auto"
            unoptimized
          />
        </div>
      )}

      {!isPreviewing && !previewUrl && (
        <div className="flex items-center justify-center py-12 text-center">
          <p className="text-sm text-[var(--muted)]">
            Click Preview to see your output before exporting
          </p>
        </div>
      )}
    </div>
  );
}
