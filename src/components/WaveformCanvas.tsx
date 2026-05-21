"use client";

import { useEffect, useRef } from "react";

interface Props {
  samples: number[];
  loading: boolean;
  hasAudio: boolean;
}

// Reads a CSS variable from :root, falling back to a default
function getCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export default function WaveformCanvas({ samples, loading, hasAudio }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const { width, height } = canvas.getBoundingClientRect();

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const midY = height / 2;

    // Read theme colour from :root — falls back to a visible purple
    const accentColor = getCssVar("--film-500", "#8b5cf6");

    if (!hasAudio || samples.length === 0) {
      // Flat centre line for silent videos
      ctx.beginPath();
      ctx.strokeStyle = accentColor;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
      return;
    }

    const barWidth = width / samples.length;
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.7;

    for (let i = 0; i < samples.length; i++) {
      const amplitude = samples[i];
      const barHeight = Math.max(amplitude * (height * 0.92), 1.5);
      const x = i * barWidth;
      const y = midY - barHeight / 2;
      ctx.fillRect(x, y, Math.max(barWidth - 0.5, 0.5), barHeight);
    }
  }, [samples, loading, hasAudio]);

  if (loading) {
    return (
      <div
        aria-label="Loading waveform"
        className="w-full h-16 rounded-md overflow-hidden bg-[var(--surface)] relative border border-[var(--border)]"
      >
        <div className="absolute inset-0 flex items-center gap-px px-2">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-film-500 opacity-20 animate-pulse"
              style={{
                height: `${18 + Math.sin(i * 0.6) * 14 + Math.cos(i * 1.1) * 10}%`,
                animationDelay: `${(i * 25) % 500}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={hasAudio ? "Audio waveform" : "No audio track"}
      aria-hidden={!hasAudio}
      className="w-full h-16 rounded-md border border-[var(--border)] bg-[var(--surface)]"
    />
  );
}