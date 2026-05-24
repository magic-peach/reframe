"use client";

import { Image as ImageIcon } from "lucide-react";
import BaseButton from "./ui/BaseButton";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PreviewPanelProps {
  previewUrl: string | null;
  isPreviewing: boolean;
  onGeneratePreview: () => void;
}

export default function PreviewPanel({
  previewUrl,
  isPreviewing,
  onGeneratePreview,
}: PreviewPanelProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-film-500 opacity-80">
          <ImageIcon size={16} />
        </span>
        <h3 className="text-sm font-heading font-bold uppercase tracking-widest text-[var(--muted)]">
          Preview
        </h3>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <BaseButton
        onClick={onGeneratePreview}
        disabled={isPreviewing}
        variant="secondary"
        size="md"
        className="w-full"
      >
        {isPreviewing ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <ImageIcon size={16} />
            Preview Frame
          </>
        )}
      </BaseButton>

      {previewUrl && (
        <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg)]">
          <Image
            src={previewUrl}
            alt="Frame preview"
            width={1920}
            height={1080}
            className="w-full h-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}
