"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FiArrowRight } from "react-icons/fi";

export default function Navbar() {
  const scroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="sticky top-4 z-50 mx-auto w-full max-w-[90%] 2xl:max-w-[1500px] px-6 md:px-10">
      <nav className="flex items-center justify-between rounded-2xl bg-[var(--surface)]/70 backdrop-blur-xl px-6 py-3 shadow-md ring-1 ring-[var(--border)]/60">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
          <BrandLogo size={22} className="text-film-600" />
          <span className="text-base font-semibold tracking-tight text-[var(--text)]">Reframe</span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" onClick={(e) => scroll(e, "features")} className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Features</a>
          <a href="#privacy" onClick={(e) => scroll(e, "privacy")} className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Privacy</a>
          <a href="#workflow" onClick={(e) => scroll(e, "workflow")} className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">How It Works</a>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/reframe"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-sm text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Open Editor
            <FiArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </div>
  );
}
