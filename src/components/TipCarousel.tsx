"use client";

import { useEffect, useState, useRef } from "react";
import { ShieldCheck, Zap, Keyboard, Cpu, SlidersHorizontal } from "lucide-react";

interface Tip {
  category: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const TIPS: Tip[] = [
  {
    category: "PRIVACY FIRST",
    title: "100% Local Sandbox",
    description: "Your video files never leave your device. All processing happens entirely within your browser's secure client-side sandbox.",
    icon: ShieldCheck,
  },
  {
    category: "PERFORMANCE BOOST",
    title: "Keep This Tab Active",
    description: "Keep this browser tab active and focused. The browser heavily throttles background WebAssembly threads to save power.",
    icon: Zap,
  },
  {
    category: "WORKFLOW POWER",
    title: "Keyboard Shortcuts",
    description: "Press Space to play/pause the preview, M to mute, and Ctrl/Cmd+Enter to trigger an export instantly.",
    icon: Keyboard,
  },
  {
    category: "ENGINEERING FACT",
    title: "FFmpeg WebAssembly",
    description: "Reframe compiles powerful C/C++ libraries into WASM, allowing complex video pipelines to run locally in the browser.",
    icon: Cpu,
  },
  {
    category: "PRO TIP",
    title: "Export Quality (CRF)",
    description: "Adjusting the Constant Rate Factor (CRF) slider gives you total control over the sweet spot between visual quality and file size.",
    icon: SlidersHorizontal,
  },
];

export default function TipCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rotateTip = () => {
    setIsFading(true);
    timeoutRef.current = setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % TIPS.length);
      setIsFading(false);
    }, 300);
  };

  useEffect(() => {
    intervalRef.current = setInterval(rotateTip, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleDotClick = (idx: number) => {
    if (idx === activeIdx || isFading) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setIsFading(true);
    timeoutRef.current = setTimeout(() => {
      setActiveIdx(idx);
      setIsFading(false);
      intervalRef.current = setInterval(rotateTip, 6000);
    }, 300);
  };

  const activeTip = TIPS[activeIdx];
  if (!activeTip) return null;
  const IconComponent = activeTip.icon; 

  return (
    <div 
      className="mt-6 p-4 rounded-xl border bg-[var(--surface)] border-[var(--border)] text-[var(--text)] text-left flex flex-col justify-between min-h-[142px] transition-all duration-300 shadow-sm relative overflow-hidden"
    >
      {/* Dynamic Slide Container */}
      <div 
        className={`flex-1 transition-all duration-300 transform ${
          isFading ? "opacity-0 -translate-y-1.5 scale-[0.99]" : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <IconComponent className="text-film-600 dark:text-film-400" size={14} />
          <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-film-600 dark:text-film-400">
            {activeTip.category}
          </span>
        </div>
        
        <h4 className="text-xs font-heading font-bold mt-1 text-[var(--text)] tracking-wide uppercase">
          {activeTip.title}
        </h4>
        
        <p className="text-[11px] leading-relaxed text-[var(--muted)] mt-1.5">
          {activeTip.description}
        </p>
      </div>

      {/* Pagination Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {TIPS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleDotClick(idx)}
            aria-label={`Go to tip ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ease-out cursor-pointer ${
              idx === activeIdx 
                ? "w-4 bg-film-600 dark:bg-film-400" 
                : "w-1.5 bg-film-100 hover:bg-film-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
