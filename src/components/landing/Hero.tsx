"use client";

import Link from "next/link";
import { FiArrowRight, FiShield, FiUserX, FiCloudOff, FiCode, FiTv } from "react-icons/fi";
import Sparkles from "./Sparkles";

export default function Hero() {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center pt-24 pb-12">
      <Sparkles />
      <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[800px] rounded-full bg-blue-500/10 blur-[130px] dark:bg-blue-400/5" />
      <div className="absolute bottom-10 right-1/4 -z-10 h-[450px] w-[700px] rounded-full bg-violet-400/10 blur-[110px] dark:bg-violet-400/4" />

      <div className="mx-auto w-full max-w-[90%] 2xl:max-w-[1500px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-12 items-center">

          {/* Left copy */}
          <div className="lg:col-span-12 xl:col-span-6 space-y-8 text-center xl:text-left flex flex-col items-center xl:items-start">

            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/50 px-4 py-1.5 text-xs tracking-wide text-[var(--accent)] backdrop-blur-sm">
              <FiShield className="h-4 w-4" />
              <span className="font-medium">100% browser-based</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-[var(--text)] leading-[1.05]">
                Edit videos, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
                  locally.
                </span>
              </h1>
              <p className="max-w-xl text-lg sm:text-xl text-[var(--muted)] leading-relaxed">
                Resize, trim, rotate, and export — all processed in your browser. Your files never touch a server.
              </p>
            </div>

            <div className="flex flex-wrap justify-center xl:justify-start gap-4">
              <Link
                href="/reframe"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-base font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:bg-[var(--accent-hover)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Open Editor
                <FiArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                onClick={(e) => scrollTo(e, "features")}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-8 py-4 text-base font-medium text-[var(--text)] hover:bg-[var(--surface)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore Features
              </a>
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap justify-center xl:justify-start items-center gap-8 pt-6">
              {[
                { icon: <FiUserX className="h-4 w-4" />, label: "No login" },
                { icon: <FiCloudOff className="h-4 w-4" />, label: "No uploads" },
                { icon: <FiCode className="h-4 w-4" />, label: "Open source" },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <span className="text-[var(--accent)]">{t.icon}</span>
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right mockup */}
          <div className="lg:col-span-12 xl:col-span-6 flex justify-center w-full">
            <div className="relative w-full max-w-3xl rounded-2xl bg-[var(--surface)] p-5 shadow-2xl ring-1 ring-[var(--border)]/50 transition-transform duration-500 hover:scale-[1.02] overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]/50">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-green-400/80" />
                </div>
                <span className="text-xs font-medium text-[var(--muted)]">Reframe Studio — Local Environment</span>
                <FiTv className="h-4 w-4 text-[var(--muted)]/60" />
              </div>

              {/* Workspace Mockup */}
              <div className="grid grid-cols-12 gap-4 h-64 sm:h-80">
                {/* Sidebar */}
                <div className="col-span-4 rounded-xl bg-[var(--bg)] ring-1 ring-[var(--border)]/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-widest text-[var(--muted)] mb-4">Presets</span>
                    <div className="space-y-2">
                      <div className="rounded-lg px-3 py-2 text-xs bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30 text-[var(--accent)] font-medium">9:16 TikTok</div>
                      <div className="rounded-lg px-3 py-2 text-xs text-[var(--muted)]">16:9 YouTube</div>
                      <div className="rounded-lg px-3 py-2 text-xs text-[var(--muted)]">1:1 Instagram</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 ring-1 ring-emerald-500/20 text-center">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Local WASM</span>
                  </div>
                </div>
                
                {/* Preview */}
                <div className="col-span-8 rounded-xl bg-[var(--bg)] ring-1 ring-[var(--border)]/40 flex flex-col relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/20 backdrop-blur-sm text-[8px] text-white">9:16</div>
                  <div className="flex-1 flex items-center justify-center p-6 pb-2">
                    <div className="w-24 sm:w-32 aspect-[9/16] rounded-md bg-[var(--surface)] ring-1 ring-[var(--border)]/30 flex items-center justify-center relative overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-[var(--border)]/30 flex justify-between items-center bg-[var(--surface)]/30">
                    <span className="text-[10px] font-mono text-[var(--muted)]">0:04 / 0:15</span>
                    <div className="h-1 w-24 bg-[var(--border)]/40 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-[var(--accent)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-4 h-16 sm:h-20 rounded-xl bg-[var(--bg)] ring-1 ring-[var(--border)]/40 p-4 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-medium text-[var(--muted)]">Track 1</span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">0:15s</span>
                </div>
                <div className="h-6 w-full rounded-md bg-[var(--surface)] ring-1 ring-[var(--border)]/20 flex items-center px-1 overflow-hidden">
                   <div className="h-3 w-full opacity-40 flex items-end gap-0.5">
                     {[...Array(60)].map((_, i) => (
                       <div key={i} className="flex-1 bg-[var(--muted)] rounded-t-sm" style={{ height: `${Math.random() * 100}%` }} />
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
