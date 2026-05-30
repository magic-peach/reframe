"use client";

import React from "react";
// Import your own project tools and workspace icons here as needed
import { Video, Scissors, Crop, Download, Globe, Github, Twitter } from "lucide-react";

export default function Home() {
  return (
    // The main container uses flexbox with min-h to push the footer to the bottom
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      
      {/* ── CORE WORKSPACE CONTENT AREA ── */}
      <div className="flex-grow p-6 md:p-12">
        <div className="max-w-6xl mx-auto text-center my-12">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            Free Browser-Based Video Studio
          </h2>
          <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto mb-8">
            Fast, client-side browser performance powered by FFmpeg.wasm. No server uploads required.
          </p>
          
          {/* Placeholder/Dropzone area representing Reframe's main feature canvas */}
          <div className="border-2 border-dashed border-[var(--border)] rounded-[var(--radius)] p-12 bg-[var(--surface)]/50 transition-all flex flex-col items-center justify-center min-h-[300px]">
            <Video className="w-12 h-12 text-[var(--muted)] mb-4 animate-pulse" />
            <p className="text-lg font-medium mb-1">Drag and drop your video file here</p>
            <p className="text-sm text-[var(--muted)] mb-6">MP4, WebM, or MOV up to 500MB</p>
            <button className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-[var(--radius)] transition-all shadow-sm">
              Select Video File
            </button>
          </div>
        </div>
      </div>

      {/* ── UPDATED COMPLIANT FOOTER AREA ── */}
      {/* Contains distinct border partitioning and background panel coloring matching global css styles */}
      <footer className="w-full mt-auto border-t border-[var(--border)] bg-[var(--surface)] px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Block: Branding statement */}
          <div className="text-center md:text-left">
            <h3 className="font-bold text-base text-[var(--text)]">Browser Video Studio</h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              © 2026 Reframe App. Processed locally on your device via client-side architecture.
            </p>
          </div>

          {/* Center Block: Navigation anchors */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-[var(--muted)]">
            <a href="#" className="hover:text-[var(--text)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">Contributing Guide</a>
          </div>

          {/* Right Block: Social Community Links */}
          <div className="flex items-center gap-4 text-[var(--muted)]">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository" className="hover:text-[var(--text)] transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter Profile" className="hover:text-[var(--text)] transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Global Web Site" className="hover:text-[var(--text)] transition-colors">
              <Globe className="w-5 h-5" />
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
