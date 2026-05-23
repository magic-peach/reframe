"use client";

import { useEffect, useState, useRef, memo } from "react";
import { ShieldCheck, Zap, Keyboard, Cpu, SlidersHorizontal, Info } from "lucide-react";

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

export default memo(function TipCarousel() {
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
    intervalRef.current = setInterval(rotateTip, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const activeTip = TIPS[activeIdx];
  if (!activeTip) return null;
  const IconComponent = activeTip.icon; 

  return (
    <div 
      className="mt-2 p-5 rounded-2xl border bg-[var(--surface)]/50 backdrop-blur-sm border-[var(--border)] text-left flex flex-col justify-between min-h-[140px] transition-all duration-300 shadow-xl relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-[#f24951] opacity-50" />
      
      {/* Dynamic Slide Container */}
      <div 
        className={`flex-1 transition-all duration-500 transform ${
          isFading ? "opacity-0 translate-y-1 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#f24951]/10 text-[#f24951]">
              <IconComponent size={14} />
            </div>
            <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-[#f24951]/80">
              {activeTip.category}
            </span>
          </div>
          <Info size={14} className="text-[var(--muted)] opacity-50" />
        </div>
        
        <h4 className="text-sm font-heading font-bold mt-3 text-[var(--text)] tracking-wide uppercase">
          {activeTip.title}
        </h4>
        
        <p className="text-[11px] leading-relaxed text-[var(--muted)] mt-2 font-medium">
          {activeTip.description}
        </p>
      </div>

      {/* Pagination Indicators */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {TIPS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-500 ease-out ${
              idx === activeIdx 
                ? "w-6 bg-[#f24951] shadow-[0_0_8px_rgba(242,73,81,0.4)]" 
                : "w-2 bg-[var(--border)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
});

