'use client';

import React from 'react';
import { Github } from 'lucide-react';
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  return (
    <header
      className="
        sticky top-0 z-50 w-full
        border-b border-[var(--border)]
        bg-[var(--bg)]
        shadow-sm
        transition-colors duration-300
      "
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Left Section - Logo */}
        <div 
          onClick={() => window.location.reload()} 
          className="group flex cursor-pointer items-center gap-2 sm:gap-3"
        >
          {/* Logo Icon */}
          <div
            className="
              flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center
              rounded-xl sm:rounded-2xl
              bg-gradient-to-br from-blue-500 to-cyan-400
              shadow-lg shadow-blue-500/20
              transition-transform duration-300
              group-hover:scale-110
            "
          >
            <span className="text-base sm:text-lg font-bold text-white">
              R
            </span>
          </div>

          {/* Logo Text */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] leading-none">
              Reframe
            </h1>
            <p className="hidden text-[10px] sm:text-xs text-[var(--muted)] sm:block mt-0.5">
              In-Browser Video Editor
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Fully Responsive GitHub Button */}
          <a
            href="https://github.com/magic-peach/reframe"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl
              border border-[var(--border)]
              bg-[var(--surface)]
              p-2.5 sm:px-5 sm:py-2.5
              text-xs sm:text-sm font-semibold uppercase tracking-wider
              text-[var(--text)]
              transition-all duration-300
              hover:opacity-90
            "
          >
            <Github size={16} className="text-[var(--text)] transition-transform duration-300 hover:rotate-12" />
            
            {/* Mobile: Shows only ⭐ | Desktop: Shows full text */}
            <span className="sm:hidden">⭐</span>
            <span className="hidden sm:inline">⭐ Star on GitHub</span>
          </a>

          {/* Divider */}
          <div className="h-8 w-px bg-[var(--border)]" />

          {/* Theme Toggle Container */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 transition-all duration-300">
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}