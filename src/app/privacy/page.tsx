import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Privacy Policy — Reframe",
  description: "Privacy policy for Reframe — your videos never leave your device.",
};
export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-20">

        {/* Back link - top left below header */}
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
            {/* Eye Logo */}
            <div className="mb-6">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[var(--accent)]"
              >
                <path d="M12 4.5C7 4.5 3 12 3 12C3 12 7 19.5 12 19.5C17 19.5 21 12 21 12C21 12 17 4.5 12 4.5Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                      stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
              </svg>
            </div>

            <h1 className="text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          </div>

          {/* Bordered Content Box */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 md:p-14">
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-[var(--muted)] leading-relaxed">
                At Reframe, we respect your privacy and are committed to protecting your personal data.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">1. Data Collection</h2>
              <p className="text-[var(--muted)]">
                Reframe processes videos entirely on-device using FFmpeg.wasm.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">2. File Handling</h2>
              <p className="text-[var(--muted)]">
                Your files are never uploaded, stored, or shared with any server.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">3. Analytics & Tracking</h2>
              <p className="text-[var(--muted)]">
                No analytics, tracking, or account system is used.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text)]">4. Open Source</h2>
              <p className="text-[var(--muted)]">
                Reframe is open source and publicly verifiable on GitHub.
              </p>

              <div className="mt-16 pt-8 border-t border-[var(--border)] text-center">
                <p className="text-[var(--muted)]">
                  If you have any questions about this Privacy Policy, please{" "}
                  <Link href="/contact" className="text-[var(--accent)] hover:underline">
                    contact us
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