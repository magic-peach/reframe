"use client";

import { Gift, Lock, WifiOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Lock, label: "Private" },
  { icon: Zap, label: "Fast" },
  { icon: Gift, label: "Free" },
  { icon: WifiOff, label: "Works offline" },
] as const;

interface HeroSectionProps {
  onChooseVideo: () => void;
}

export default function HeroSection({ onChooseVideo }: HeroSectionProps) {
  return (
    <section
      aria-labelledby="hero-headline"
      className="mb-5 animate-fade-in"
    >
      <div className="relative text-center px-2 sm:px-4 py-4 sm:py-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 sm:h-40 bg-gradient-to-b from-film-500/10 via-transparent to-transparent blur-2xl rounded-full"
          aria-hidden="true"
        />

        <div className="relative space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          <h2
            id="hero-headline"
            className="font-display text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-wide text-[var(--text)]"
          >
            Resize, trim &amp; export videos — entirely in your browser
          </h2>

          <p className="font-heading text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            No upload. No account. No limits. Powered by FFmpeg.wasm
          </p>

          <ul
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1"
            aria-label="Features"
          >
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label}>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    "text-xs font-heading font-semibold uppercase tracking-wider",
                    "bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)]"
                  )}
                >
                  <Icon size={14} className="text-film-500 shrink-0" aria-hidden="true" />
                  {label}
                </span>
              </li>
            ))}
          </ul>

          <div className="pt-2 sm:pt-3">
            <button
              type="button"
              onClick={onChooseVideo}
              aria-label="Choose a video to edit"
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl",
                "font-display text-lg sm:text-xl tracking-widest",
                "bg-film-600 hover:bg-film-700 text-white",
                "shadow-lg shadow-film-500/20",
                "hover:scale-[1.02] active:scale-[0.98]",
                "transition-all duration-200"
              )}
            >
              Choose a video
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
