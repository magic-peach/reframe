"use client";

import { useEffect, useRef, useState } from "react";
import { FiLock, FiCpu, FiCloudOff, FiEyeOff, FiKey } from "react-icons/fi";

/* ── tiny animated bar chart to show "zero data leaves" visually ── */
function DataFlowChart() {
  const bars = [
    { label: "Uploaded", value: 0, color: "bg-emerald-500" },
    { label: "Processed locally", value: 100, color: "bg-blue-500" },
    { label: "Stored on server", value: 0, color: "bg-emerald-500" },
    { label: "Shared externally", value: 0, color: "bg-emerald-500" },
  ];
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setAnimate(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-4.5 mt-8">
      <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-semibold">Data flow breakdown</p>
      {bars.map((b, i) => (
        <div key={i} className="flex items-center gap-3.5">
          <span className="text-xs font-medium text-[var(--muted)] w-36 shrink-0 text-right">{b.label}</span>
          <div className="flex-1 h-5 rounded-full bg-[var(--bg)] ring-1 ring-[var(--border)]/30 overflow-hidden">
            <div
              className={`h-full rounded-full ${b.color} transition-all duration-1000 ease-out`}
              style={{ width: animate ? `${b.value}%` : "0%" }}
            />
          </div>
          <span className="text-sm font-mono text-[var(--muted)] w-10">{b.value}%</span>
        </div>
      ))}
    </div>
  );
}

const trustCards = [
  {
    icon: <FiLock className="h-6 w-6" />,
    title: "Browser-only processing",
    desc: "Video renders execute in your browser tab. No external calls, no relay servers.",
    accent: "text-emerald-500",
    ring: "ring-emerald-500/15",
  },
  {
    icon: <FiCpu className="h-6 w-6" />,
    title: "Client-side FFmpeg",
    desc: "WebAssembly runs native C libraries in a sandboxed environment right on your CPU.",
    accent: "text-blue-500",
    ring: "ring-blue-500/15",
  },
  {
    icon: <FiCloudOff className="h-6 w-6" />,
    title: "No uploads",
    desc: "Files load into browser memory and are deleted the moment you close the tab.",
    accent: "text-rose-500",
    ring: "ring-rose-500/15",
  },
  {
    icon: <FiEyeOff className="h-6 w-6" />,
    title: "No tracking",
    desc: "Zero analytics, zero usage logs, zero personal data collection.",
    accent: "text-violet-500",
    ring: "ring-violet-500/15",
  },
  {
    icon: <FiKey className="h-6 w-6" />,
    title: "No login required",
    desc: "No email, no password, no sign-up. Just open the page and start editing.",
    accent: "text-amber-500",
    ring: "ring-amber-500/15",
  },
];

export default function PrivacySection() {
  return (
    <section id="privacy" className="flex flex-col justify-center py-28 relative overflow-hidden">
      <div className="absolute right-0 top-1/3 -z-10 h-80 w-80 rounded-full bg-indigo-500/6 blur-[100px]" />

      <div className="mx-auto w-full max-w-[90%] 2xl:max-w-[1500px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-20 lg:grid-cols-12 lg:gap-16 items-center">

          {/* Left column */}
          <div className="lg:col-span-5 space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] font-bold text-[var(--accent)]">Privacy</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight">
              Your videos never leave your device.
            </h2>
            <p className="text-lg text-[var(--muted)] leading-relaxed">
              Most online editors upload gigabytes to their servers. Reframe processes every frame on your machine — saving bandwidth, time, and your peace of mind.
            </p>

            {/* Interactive chart */}
            <DataFlowChart />
          </div>

          {/* Right cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trustCards.map((card, i) => (
              <div
                key={i}
                className={`rounded-xl bg-[var(--surface)]/50 backdrop-blur-sm p-5 ring-1 ${card.ring} hover:ring-[var(--border)] transition-all duration-300 ${i === 0 ? "sm:col-span-2" : ""}`}
              >
                <div className={`${card.accent} mb-3.5`}>{card.icon}</div>
                <h4 className="text-base font-bold text-[var(--text)] mb-1.5">{card.title}</h4>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
