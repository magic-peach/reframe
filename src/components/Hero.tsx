"use client";

import { Lock, Zap, Gift, Wifi, Play } from "lucide-react";

interface HeroProps {
  onUploadClick: () => void;
}

export default function Hero({ onUploadClick }: HeroProps) {
  const features = [
    {
      icon: Lock,
      title: "Private",
      description: "100% local processing",
    },
    {
      icon: Zap,
      title: "Fast",
      description: "Lightning quick edits",
    },
    {
      icon: Gift,
      title: "Free",
      description: "No hidden costs",
    },
    {
      icon: Wifi,
      title: "Works Offline",
      description: "No internet needed",
    },
  ];

  return (
    <div className="w-full bg-gradient-to-b from-[var(--surface)] to-[var(--bg)] rounded-xl border border-[var(--border)] p-8 sm:p-12 mb-6 animate-fade-in">
      {/* Main Content */}
      <div className="max-w-3xl mx-auto text-center">
        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-widest text-[var(--text)] mb-4">
          Resize, trim & export videos — entirely in your browser
        </h1>

        {/* Subheadline */}
        <p className="font-heading text-lg sm:text-xl text-[var(--muted)] mb-8">
          No upload. No account. No limits. Powered by FFmpeg.wasm.
        </p>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:border-film-500/50 transition-colors duration-200"
              >
                <div className="text-film-500">
                  <Icon size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-sm text-[var(--text)]">
                    {feature.title}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onUploadClick}
            className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-film-500 hover:bg-film-600 text-white font-heading font-bold uppercase tracking-wider rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:scale-105"
          >
            <Play size={18} className="group-hover:scale-110 transition-transform" />
            Choose a video
          </button>
          <p className="text-sm text-[var(--muted)] font-heading">
            or drag and drop anywhere
          </p>
        </div>
      </div>
    </div>
  );
}
