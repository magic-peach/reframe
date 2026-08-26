"use client";

import Link from "next/link";
import { FiArrowRight, FiGithub } from "react-icons/fi";
import Sparkles from "./Sparkles";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden py-32 flex flex-col justify-center">
      <Sparkles />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/3 to-indigo-500/5 -z-10" />

      {/* CTA */}
      <div className="mx-auto w-full max-w-[90%] 2xl:max-w-[1500px] px-6 md:px-10 text-center">
        <h2 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight text-[var(--text)] mb-8 leading-tight">
          Ready to reframe?
        </h2>
        <p className="mx-auto max-w-2xl text-xl text-[var(--muted)] mb-12 leading-relaxed">
          No signups, no watermarks, no usage limits. Just you and your video.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/reframe"
            className="inline-flex items-center gap-3 rounded-xl bg-[var(--accent)] px-10 py-5 text-lg font-medium text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:bg-[var(--accent-hover)] transition-all hover:scale-105 active:scale-95"
          >
            Open Editor
            <FiArrowRight className="h-5 w-5" />
          </Link>
          <a
            href="https://github.com/magic-peach/reframe"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 px-7 py-3 text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-all hover:-translate-y-px"
          >
            <FiGithub className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
