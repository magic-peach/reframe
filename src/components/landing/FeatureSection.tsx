"use client";

import { useState } from "react";
import { FiLayout, FiMove, FiScissors, FiZap, FiVolume2, FiDownload } from "react-icons/fi";

const features = [
  {
    icon: <FiLayout className="h-6 w-6" />,
    title: "Instant Resizing",
    description: "Resize for YouTube, TikTok, Reels, or square — one click, done.",
    color: "text-blue-500",
    bg: "bg-blue-500/8 dark:bg-blue-500/10",
  },
  {
    icon: <FiMove className="h-6 w-6" />,
    title: "Flexible Framing",
    description: "Reposition and scale your subject dynamically to keep focus where it matters.",
    color: "text-violet-500",
    bg: "bg-violet-500/8 dark:bg-violet-500/10",
  },
  {
    icon: <FiScissors className="h-6 w-6" />,
    title: "Precise Trimming",
    description: "Cut timelines with sub-second precision. Keep the good parts, drop the rest.",
    color: "text-rose-500",
    bg: "bg-rose-500/8 dark:bg-rose-500/10",
  },
  {
    icon: <FiZap className="h-6 w-6" />,
    title: "Speed Control",
    description: "Slow-motion replays or quick timelapses — adjust playback speed per segment.",
    color: "text-amber-500",
    bg: "bg-amber-500/8 dark:bg-amber-500/10",
  },
  {
    icon: <FiVolume2 className="h-6 w-6" />,
    title: "Audio Control",
    description: "Adjust volume, extract tracks, or mute — all from the same interface.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/8 dark:bg-emerald-500/10",
  },
  {
    icon: <FiDownload className="h-6 w-6" />,
    title: "Fast Export",
    description: "Renders locally via FFmpeg WASM. No waiting on servers, no quality loss.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/8 dark:bg-cyan-500/10",
  },
];

export default function FeatureSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="features" className="flex flex-col justify-center py-28 relative overflow-hidden">
      <div className="mx-auto w-full max-w-[90%] 2xl:max-w-[1500px] px-6 md:px-10">

        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-sm uppercase tracking-[0.2em] font-bold text-[var(--accent)] mb-4">Capabilities</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight">
            Everything you need,<br />running locally.
          </h2>
          <p className="mt-6 text-lg text-[var(--muted)] leading-relaxed max-w-xl">
            A full video toolkit powered by WebAssembly. Nothing leaves your machine.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-xl bg-[var(--surface)]/60 backdrop-blur-sm p-5 ring-1 ring-[var(--border)]/40 hover:ring-[var(--border)] transition-all duration-300 cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                transform: hovered === i ? "translateY(-3px)" : "translateY(0)",
              }}
            >
              <div className={`inline-flex items-center justify-center h-11 w-11 rounded-lg ${f.bg} ${f.color} mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-[var(--text)] mb-1.5">{f.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
