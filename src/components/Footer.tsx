"use client";

import Link from "next/link";
import {
  Github,
  Instagram,
  Linkedin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  ExternalLink,
  Lock,
  Mail,
} from "lucide-react";

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-6 py-16 mt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-y-12 gap-x-8 lg:gap-x-12">
        {/* Brand Section */}
        <div className="sm:col-span-2 lg:col-span-5 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reframe</h2>
            <p className="text-[10px] font-mono tracking-[0.35em] uppercase opacity-50 mt-1">
              Browser Video Studio
            </p>
          </div>

          <p className="text-sm opacity-70 leading-relaxed max-w-md">
            Professional video processing directly in your browser using{" "}
            <span className="font-medium opacity-100">FFmpeg.wasm</span> — fast,
            private, and open source.
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              { icon: <ShieldCheck size={12} />, label: "100% Local" },
              { icon: <Zap size={12} />, label: "Fast" },
              { icon: <Globe size={12} />, label: "Open Source" },
            ].map((tag) => (
              <span
                key={tag.label}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-semibold tracking-wide uppercase opacity-80 hover:opacity-100 hover:border-[var(--accent)] transition-all"
              >
                {tag.icon}
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="sm:col-span-1 lg:col-span-3 space-y-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60">
            Navigation
          </h3>

          <nav className="flex flex-col gap-3 text-sm">
            <a
              href="https://github.com/magic-peach/reframe"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="flex items-center gap-2 opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded"
            >
              <Github size={14} />
              GitHub
              <ExternalLink size={10} className="opacity-60" />
            </a>

            <Link
              href="/contact"
              aria-label="Contact page"
              className="flex items-center gap-2 opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded"
            >
              <Mail size={14} />
              Contact
            </Link>

            <Link
              href="/privacy"
              aria-label="Privacy policy"
              className="flex items-center gap-2 opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-all w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded"
            >
              <Lock size={14} />
              Privacy Policy
            </Link>
          </nav>
        </div>

        {/* Right Section */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-10 lg:justify-self-end w-full lg:w-auto">
          {/* Newsletter */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60">
              Updates
            </h3>

            <form
              className="flex items-center w-full sm:w-80 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[var(--accent)] transition"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Newsletter signup"
            >
              <input
                type="email"
                required
                placeholder="Enter your email"
                aria-label="Email address"
                className="w-full bg-transparent py-3 text-[11px] font-semibold tracking-widest uppercase placeholder:opacity-30 focus:outline-none"
              />

              <button
                type="submit"
                aria-label="Subscribe to updates"
                onMouseDown={(e) => e.preventDefault()} className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60">
              Community
            </h3>

            <div className="flex items-center gap-3 flex-wrap">
              {[
                {
                  href: "https://github.com/magic-peach/reframe",
                  icon: <Github size={18} />,
                  label: "GitHub",
                },
                {
                  href: "https://x.com/reframeapp",
                  icon: <XIcon size={18} />,
                  label: "X (Twitter)",
                },
                {
                  href: "https://instagram.com/reframeapp",
                  icon: <Instagram size={18} />,
                  label: "Instagram",
                },
                {
                  href: "https://linkedin.com/company/reframeapp",
                  icon: <Linkedin size={18} />,
                  label: "LinkedIn",
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="relative group p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                >
                  <span className="opacity-70 group-hover:opacity-100">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.25em] opacity-50">
        <p>© {new Date().getFullYear()} Reframe · MIT License</p>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
          Processing happens locally
        </div>
      </div>
    </footer>
  );
}
