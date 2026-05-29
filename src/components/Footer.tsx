"use client";

import { useState } from "react";
import Link from "next/link";
import { Github, Twitter, Instagram, Linkedin, ArrowRight, ShieldCheck, Zap, Globe, ExternalLink, Lock, Mail } from "lucide-react";

export default function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-6 py-16 mt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

        {/* Brand Section */}
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Reframe</h2>
            <p className="text-[9px] font-mono tracking-[0.4em] uppercase opacity-50">Browser Video Studio</p>
          </div>
          <p className="text-sm opacity-70 leading-relaxed max-w-sm">
            Professional video processing directly in your browser using
            <span className="font-medium opacity-100"> FFmpeg.wasm</span> — fast, private, and open source.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: <ShieldCheck size={12} />, label: "100% Local" },
              { icon: <Zap size={12} />, label: "Fast" },
              { icon: <Globe size={12} />, label: "Open Source" },
            ].map((tag) => (
              <span key={tag.label} className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] cursor-pointer select-none">
                {tag.icon} {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Links Section */}
        <div className="md:col-span-3 space-y-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Navigation</h3>
          <nav className="flex flex-col gap-3 text-sm">
            <a href="https://github.com/magic-peach/reframe" target="_blank" rel="noopener" className="opacity-70 hover:opacity-100 hover:text-[var(--accent)] hover:translate-x-1 transition-all duration-300 w-fit flex items-center gap-2 group">
              <Github size={14} className="group-hover:scale-110 transition-transform duration-300" />
              GitHub
              <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            </a>
            <Link href="/contact" className="opacity-70 hover:opacity-100 hover:text-[var(--accent)] hover:translate-x-1 transition-all duration-300 w-fit flex items-center gap-2 group">
              <Mail size={14} className="group-hover:scale-110 transition-transform duration-300" />
              Contact
            </Link>
            <Link href="/privacy" className="opacity-70 hover:opacity-100 hover:text-[var(--accent)] hover:translate-x-1 transition-all duration-300 w-fit flex items-center gap-2 group">
              <Lock size={14} className="group-hover:scale-110 transition-transform duration-300" />
              Privacy Policy
            </Link>
          </nav>
        </div>

        {/* Right Section */}
        <div className="md:col-span-4 flex flex-col items-start md:items-end space-y-8">

          {/* Newsletter */}
          <div className="w-full flex flex-col items-start md:items-end gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Updates</h3>
            {!isExpanded ? (
              <button type="button" onClick={() => setIsExpanded(true)} aria-label="Open updates signup form" aria-expanded={isExpanded} aria-controls="updates-signup-form" className="w-40 px-3 flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-lg py-3 hover:bg-[var(--border)] transition-all duration-500 group">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">Stay Tuned</span>
              </button>
            ) : (
              <div id="updates-signup-form" className="w-full sm:w-72 px-4 flex items-center bg-[var(--surface)] border border-[var(--accent)] rounded-lg transition-all duration-500">
                <form aria-label="Updates signup form" onSubmit={(e) => { e.preventDefault(); setIsExpanded(false); }} className="flex w-full items-center">
                  <input type="email" placeholder="ENTER EMAIL" className="bg-transparent border-none text-[10px] font-bold tracking-widest text-[var(--text)] focus:outline-none w-full py-3 placeholder:opacity-30" aria-label="Email address for updates" onBlur={() => setIsExpanded(false)} />
                  <button aria-label="Submit email for updates" type="submit" className="text-[var(--accent)] hover:text-[var(--accent-hover)] p-1">
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Community */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Community</h3>
            <div className="flex items-center gap-3">
              {[
                { href: "https://github.com/magic-peach/reframe", icon: <Github size={18} />, label: "GitHub", tooltip: "Star us on GitHub" },
                { href: "https://twitter.com", icon: <Twitter size={18} />, label: "Twitter", tooltip: "Follow on Twitter" },
                { href: "https://instagram.com", icon: <Instagram size={18} />, label: "Instagram", tooltip: "Follow on Instagram" },
                { href: "https://linkedin.com", icon: <Linkedin size={18} />, label: "LinkedIn", tooltip: "Connect on LinkedIn" },
              ].map((social) => (
                <div key={social.label} className="relative group">
                  <a href={social.href} target="_blank" rel="noopener" aria-label={social.label} className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] transition-all duration-200 hover:-translate-y-1 active:scale-95 flex items-center justify-center">
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity duration-200">{social.icon}</span>
                  </a>
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[var(--text)] text-[var(--bg)] text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    {social.tooltip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">
        <p>© {new Date().getFullYear()} Reframe · MIT License</p>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
          Processing happens locally
        </div>
      </div>
    </footer>
  );
}