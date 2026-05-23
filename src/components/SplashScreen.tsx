"use client";

import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Give the app a moment to load and display the splash screen
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1800);

    // Completely unmount after fade transition
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2300);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Avoid hydration mismatch by only rendering after mount
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg)] transition-all duration-500 ease-in-out ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
        <BrandLogo 
          size={96} 
          className="text-film-600 drop-shadow-[0_0_20px_rgba(230,57,70,0.6)] dark:drop-shadow-[0_0_30px_rgba(230,57,70,0.8)] transition-all duration-300" 
        />
        <h1 className="text-6xl font-bold tracking-tighter text-[var(--text)] drop-shadow-sm">
          Reframe
        </h1>
      </div>
    </div>
  );
}
