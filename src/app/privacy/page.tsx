import Link from "next/link";

export default function PrivacyPage() {
  return (
    <>
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-24 pb-20 bg-gradient-to-b from-[var(--bg)] to-black/20">

        {/* Back link - top left below header */}
        <div className="px-6 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)] transition-all duration-300 hover:text-[var(--text)] hover:-translate-x-1"
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

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>

            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 backdrop-blur-xl p-6 shadow-lg max-w-2xl">
            <div className="flex flex-col items-center gap-3 text-center">
               <h2 className="text-xl font-semibold text-green-400">
                 100% Local & Private Processing
               </h2>

              <p className="text-sm md:text-base text-[var(--muted)]">
                   Your videos never leave your device. Reframe works entirely in your browser with no uploads, no tracking, and no account required.
              </p>

            <div className="flex flex-wrap justify-center gap-2 mt-2">
               <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                 No Uploads
               </span>

              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                Offline Friendly
              </span>

             <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
              100% Browser-Based
             </span>
       </div>
     </div>
  </div>
        </div>

          {/* Bordered Content Box */}
          <div className="bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 md:p-14 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-[var(--muted)] leading-relaxed">
                At Reframe, we respect your privacy and are committed to protecting your personal data.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-12 mb-6 text-[var(--text)]">1. Data Collection</h2>
              <p className="text-[var(--muted)]">
                Reframe processes videos entirely on-device using FFmpeg.wasm.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-12 mb-6 text-[var(--text)]">2. File Handling</h2>
              <p className="text-[var(--muted)]">
                Your files are never uploaded, stored, or shared with any server.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-12 mb-6 text-[var(--text)]">3. Analytics & Tracking</h2>
              <p className="text-[var(--muted)]">
                No analytics, tracking, or account system is used.
              </p>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-12 mb-6 text-[var(--text)]">4. Open Source</h2>
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