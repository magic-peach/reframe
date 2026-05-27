'use client';

import { useState } from 'react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 flex flex-col border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur"
    >
      {/* Main navbar */}
      <div className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-3">
        {/* Logo and branding */}
        <div className="flex items-center gap-2">
          <BrandLogo size={24} />
          <h1 className="text-sm font-semibold sm:text-base md:text-lg">Reframe</h1>
        </div>

        {/* Desktop theme toggle and mobile hamburger */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            className="inline-flex md:hidden items-center justify-center w-10 h-10 rounded-md hover:bg-[var(--surface)] transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden border-t border-[var(--border)] px-4 py-3">
          <div className="flex flex-col gap-2 text-sm">
            <Link
              href="/"
              className="px-3 py-2 rounded-md hover:bg-[var(--surface)] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/privacy"
              className="px-3 py-2 rounded-md hover:bg-[var(--surface)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 rounded-md hover:bg-[var(--surface)] transition-colors"
            >
              Contact
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
