"use client";

import { useEffect, useRef, useState } from "react";
import { FiFolder, FiSliders, FiDownload } from "react-icons/fi";

const steps = [
  {
    num: "01",
    icon: <FiFolder className="h-6 w-6" />,
    title: "Open your video",
    desc: "Drag any file in. It loads straight into browser memory — no upload progress bar.",
    color: "text-blue-500",
    ring: "ring-blue-500/20",
    bg: "bg-blue-500/8",
  },
  {
    num: "02",
    icon: <FiSliders className="h-6 w-6" />,
    title: "Edit & customize",
    desc: "Choose aspect ratios, trim the timeline, adjust speed, or rotate — all with live preview.",
    color: "text-violet-500",
    ring: "ring-violet-500/20",
    bg: "bg-violet-500/8",
  },
  {
    num: "03",
    icon: <FiDownload className="h-6 w-6" />,
    title: "Export & save",
    desc: "FFmpeg WASM renders the final file directly to your downloads folder.",
    color: "text-emerald-500",
    ring: "ring-emerald-500/20",
    bg: "bg-emerald-500/8",
  },
];

/* Animated progress bar per step — triggers on scroll */
function StepProgress({ active }: { active: boolean }) {
  return (
    <div className="h-[2px] w-full rounded-full bg-[var(--border)]/30 mt-4 overflow-hidden">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all duration-[1.5s] ease-out"
        style={{ width: active ? "100%" : "0%" }}
      />
    </div>
  );
}

export default function WorkflowSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="workflow" className="flex flex-col justify-center py-28 relative overflow-hidden">
      <div className="mx-auto w-full max-w-[90%] 2xl:max-w-[1500px] px-6 md:px-10">

        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-sm uppercase tracking-[0.2em] font-bold text-[var(--accent)] mb-4">How it works</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight">
            Three steps. No config.
          </h2>
          <p className="mt-6 text-lg text-[var(--muted)] leading-relaxed max-w-xl">
            From file to export in under a minute — entirely in your browser.
          </p>
        </div>

        {/* Steps */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <div key={i} className="group">
              <div className={`flex items-center gap-3 mb-4`}>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${step.bg} ${step.color}`}>
                  {step.icon}
                </div>
                <span className="text-xs font-mono text-[var(--muted)] tracking-widest">Step {step.num}</span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-2">{step.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{step.desc}</p>
              <StepProgress active={visible} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
