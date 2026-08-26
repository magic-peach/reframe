"use client";

import Link from "next/link";
import { FiGithub, FiShield, FiHeart } from "react-icons/fi";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)]/40 backdrop-blur-sm text-[var(--text)] px-6 py-24 transition-colors duration-300">
      <div className="max-w-[90%] 2xl:max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 px-6 md:px-10">
        
        {/* Brand Section */}
        <div className="md:col-span-6 space-y-10">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} className="text-film-600" />
            <span className="text-2xl font-bold tracking-tight">Reframe</span>
          </div>
          
          <p className="text-lg text-[var(--muted)] leading-relaxed max-w-lg">
            Free, open-source video editor running entirely client-side. Resize, trim, and format videos securely without uploading a single byte.
          </p>

          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <FiShield className="h-5 w-5 text-green-500" />
            <span>Your videos and data never leave your computer.</span>
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="md:col-span-3 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)] opacity-60">Product</h3>
          <nav className="flex flex-col gap-3.5 text-base text-[var(--muted)]">
            <Link href="/reframe" className="hover:text-[var(--text)] transition-colors duration-200">
              Open Editor
            </Link>
            <a href="#features" className="hover:text-[var(--text)] transition-colors duration-200">
              Features
            </a>
            <a href="#workflow" className="hover:text-[var(--text)] transition-colors duration-200">
              How It Works
            </a>
          </nav>
        </div>

        {/* Links Column 2 */}
        <div className="md:col-span-3 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)] opacity-60">Legal & Source</h3>
          <nav className="flex flex-col gap-3.5 text-base text-[var(--muted)]">
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-[var(--text)] transition-colors duration-200">
              Contact Support
            </Link>
            <a
              href="https://github.com/magic-peach/reframe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[var(--text)] transition-colors duration-200"
            >
              <FiGithub className="h-5 w-5" />
              GitHub
            </a>
          </nav>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-[90%] 2xl:max-w-[1500px] mx-auto mt-12 pt-8 border-t border-[var(--border)]/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[var(--muted)] px-6 md:px-10">
        <p>© {new Date().getFullYear()} Reframe. Released under the MIT License.</p>
        <p className="flex items-center gap-1.5">
          Built with <FiHeart className="h-4 w-4 text-red-500 fill-red-500" /> for privacy on the web.
        </p>
      </div>
    </footer>
  );
}
