"use client";

import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

const SPLASH_KEY = "reframe_splash_shown";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) return;

    // Only show on first visit
    const alreadyShown = localStorage.getItem(SPLASH_KEY);
    if (alreadyShown) return;

    setVisible(true);

    // Start fade-out after 1.4s
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1400);

    // Remove from DOM after fade completes
    const removeTimer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem(SPLASH_KEY, "1");
    }, 1900); // 1400ms hold + 500ms fade

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--bg)]"
      style={{
        transition: "opacity 500ms ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div
        className="flex flex-col items-center gap-4"
        style={{
          animation: "splash-in 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <BrandLogo size={48} />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Reframe
          </h1>
          <p className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-50">
            Browser Video Studio
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-32 h-0.5 bg-[var(--border)] rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-red-500 rounded-full"
            style={{
              animation: "splash-bar 1200ms ease-in-out forwards",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splash-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
