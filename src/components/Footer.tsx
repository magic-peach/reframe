"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Github,
  Twitter,
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

export default function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer
      className="
      relative
      overflow-hidden
      w-full
      border-t
      border-blue-100/60
      bg-gradient-to-b
      from-blue-50/40
      via-white
      to-blue-100/30
      dark:from-slate-950
      dark:via-slate-950
      dark:to-slate-900
      text-[var(--text)]
      px-6
      py-16
      mt-20
      transition-colors
      duration-300
      backdrop-blur-xl
    "
    >
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-200/20 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 relative z-10">
        {/* Brand Section */}
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reframe
            </h2>

            <p className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-50">
              Browser Video Studio
            </p>
          </div>

          <p className="text-sm opacity-70 leading-relaxed max-w-sm text-slate-700 dark:text-slate-300">
            Professional video processing directly in your browser using
            <span className="font-medium opacity-100">
              {" "}
              FFmpeg.wasm
            </span>{" "}
            — fast, private, and open source.
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              { icon: <ShieldCheck size={12} />, label: "100% Local" },
              { icon: <Zap size={12} />, label: "Fast" },
              { icon: <Globe size={12} />, label: "Open Source" },
            ].map((tag) => (
              <span
                key={tag.label}
                className="
                  flex
                  items-center
                  gap-1.5
                  px-4
                  py-2
                  rounded-xl
                  border
                  border-blue-100
                  bg-white/70
                  backdrop-blur-md
                  text-[10px]
                  font-semibold
                  tracking-wide
                  uppercase
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-blue-300
                  hover:bg-blue-50
                  cursor-pointer
                  select-none
                  shadow-sm
                "
              >
                {tag.icon}
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Links Section */}
        <div className="md:col-span-3 space-y-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
            Navigation
          </h3>

          <nav className="flex flex-col gap-4 text-sm">
            <a
              href="https://github.com/magic-peach/reframe"
              target="_blank"
              rel="noopener"
              className="
                opacity-70
                hover:opacity-100
                hover:text-blue-500
                hover:translate-x-1
                transition-all
                duration-300
                w-fit
                flex
                items-center
                gap-2
                group
              "
            >
              <Github
                size={14}
                className="group-hover:scale-110 transition-transform duration-300"
              />
              GitHub
              <ExternalLink
                size={10}
                className="opacity-0 group-hover:opacity-60 transition-opacity duration-300"
              />
            </a>

            <Link
              href="/contact"
              className="
                opacity-70
                hover:opacity-100
                hover:text-blue-500
                hover:translate-x-1
                transition-all
                duration-300
                w-fit
                flex
                items-center
                gap-2
                group
              "
            >
              <Mail
                size={14}
                className="group-hover:scale-110 transition-transform duration-300"
              />
              Contact
            </Link>

            <Link
              href="/privacy"
              className="
                opacity-70
                hover:opacity-100
                hover:text-blue-500
                hover:translate-x-1
                transition-all
                duration-300
                w-fit
                flex
                items-center
                gap-2
                group
              "
            >
              <Lock
                size={14}
                className="group-hover:scale-110 transition-transform duration-300"
              />
              Privacy Policy
            </Link>
          </nav>
        </div>

        {/* Right Section */}
        <div className="md:col-span-4 flex flex-col items-start md:items-end space-y-8">
          {/* Newsletter */}
          <div className="w-full flex flex-col items-start md:items-end gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              Updates
            </h3>

            {!isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label="Open updates signup form"
                aria-expanded={isExpanded}
                aria-controls="updates-signup-form"
                className="
                  w-44
                  px-3
                  flex
                  items-center
                  justify-center
                  bg-white/80
                  border
                  border-blue-100
                  rounded-xl
                  py-3
                  hover:bg-blue-50
                  transition-all
                  duration-500
                  group
                  shadow-sm
                "
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-opacity">
                  Stay Tuned
                </span>
              </button>
            ) : (
              <div
                id="updates-signup-form"
                className="
                  w-full
                  sm:w-72
                  px-4
                  flex
                  items-center
                  bg-white/80
                  border
                  border-blue-200
                  rounded-xl
                  backdrop-blur-md
                  transition-all
                  duration-500
                  shadow-sm
                "
              >
                <form
                  aria-label="Updates signup form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsExpanded(false);
                  }}
                  className="flex w-full items-center"
                >
                  <input
                    type="email"
                    placeholder="ENTER EMAIL"
                    className="
                      bg-transparent
                      border-none
                      text-[10px]
                      font-bold
                      tracking-widest
                      text-slate-700
                      focus:outline-none
                      w-full
                      py-3
                      placeholder:opacity-30
                    "
                    aria-label="Email address for updates"
                    onBlur={() => setIsExpanded(false)}
                  />

                  <button
                    aria-label="Submit email for updates"
                    type="submit"
                    className="text-blue-500 hover:text-blue-600 p-1"
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Community */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              Community
            </h3>

            <div className="flex items-center gap-3">
              {[
                {
                  href: "https://github.com/magic-peach/reframe",
                  icon: <Github size={18} />,
                  label: "GitHub",
                  tooltip: "Star us on GitHub",
                },
                {
                  href: "https://twitter.com",
                  icon: <Twitter size={18} />,
                  label: "Twitter",
                  tooltip: "Follow on Twitter",
                },
                {
                  href: "https://instagram.com",
                  icon: <Instagram size={18} />,
                  label: "Instagram",
                  tooltip: "Follow on Instagram",
                },
                {
                  href: "https://linkedin.com",
                  icon: <Linkedin size={18} />,
                  label: "LinkedIn",
                  tooltip: "Connect on LinkedIn",
                },
              ].map((social) => (
                <div key={social.label} className="relative group">
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener"
                    aria-label={social.label}
                    className="
                      p-3
                      rounded-xl
                      border
                      border-blue-100
                      bg-white/70
                      backdrop-blur-md
                      hover:border-blue-300
                      hover:bg-blue-50
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      active:scale-95
                      flex
                      items-center
                      justify-center
                      shadow-sm
                    "
                  >
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                      {social.icon}
                    </span>
                  </a>

                  <span
                    className="
                      absolute
                      -top-9
                      left-1/2
                      -translate-x-1/2
                      bg-slate-900
                      text-white
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-widest
                      px-2
                      py-1
                      rounded
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                      duration-200
                      whitespace-nowrap
                      pointer-events-none
                    "
                  >
                    {social.tooltip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="
          max-w-7xl
          mx-auto
          mt-16
          pt-8
          border-t
          border-blue-100
          flex
          flex-col
          md:flex-row
          justify-between
          items-center
          gap-4
          text-[10px]
          font-bold
          uppercase
          tracking-[0.3em]
          opacity-50
          relative
          z-10
        "
      >
        <p>© {new Date().getFullYear()} Reframe · MIT License</p>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          Processing happens locally
        </div>
      </div>
    </footer>
  );
}