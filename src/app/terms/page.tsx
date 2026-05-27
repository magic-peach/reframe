import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — Reframe",
  description: "Terms of use for Reframe — free, open-source browser-based video editor.",
};

export default function TermsPage() {
  return (
    <>
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-20">

        {/* Back link */}
        <div className="px-6 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reframe
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12 text-center flex flex-col items-center">
            {/* Scale/Balance icon */}
            <div className="mb-6">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>

            <h1 className="text-5xl font-bold tracking-tight mb-4">Terms of Use</h1>
          </div>

          {/* Bordered Content Box */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 md:p-14">
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-[var(--muted)] leading-relaxed">
                By using Reframe, you agree to the following terms. Please read them carefully.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">1. Service Description</h2>
              <p className="text-[var(--muted)]">
                Reframe is a free, open-source, browser-based video editor. All video processing
                happens entirely on your device using FFmpeg.wasm. No files are uploaded to any
                server. No account is required.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">2. No Warranty</h2>
              <p className="text-[var(--muted)]">
                Reframe is provided &quot;as is&quot;, without warranty of any kind, express or implied.
                This includes, but is not limited to, warranties of merchantability, fitness for a
                particular purpose, or non-infringement. Use it at your own discretion.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">3. Limitation of Liability</h2>
              <p className="text-[var(--muted)]">
                The Reframe contributors shall not be liable for any loss or damage, including data
                loss, corrupted files, or any indirect or consequential damages arising from your
                use of this tool.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">4. Acceptable Use</h2>
              <p className="text-[var(--muted)]">
                You are solely responsible for the content you process using Reframe. Do not use
                Reframe to process or distribute content that is illegal, harmful, or infringes on
                the rights of others.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">5. Open Source License</h2>
              <p className="text-[var(--muted)]">
                Reframe is released under the{" "}
                <a href="https://github.com/magic-peach/reframe/blob/main/MIT%20LICENSE" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">MIT License</a>
                {". You are free to use, copy, modify, and distribute this software in accordance with the terms of that license."}
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">6. Privacy</h2>
              <p className="text-[var(--muted)]">
                For information on how Reframe handles your data, please
                read our{" "}
                <Link href="/privacy" className="text-[var(--accent)] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              <div className="mt-16 pt-8 border-t border-[var(--border)] text-center">
                <p className="text-[var(--muted)]">
                  Questions about these terms? Reach out via{" "}
                  <Link href="/contact" className="text-[var(--accent)] hover:underline">
                    contact
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}