import VideoEditor from "@/components/VideoEditor";

export default function Home() {
  return (
    <>
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-20 top-3 z-50 hidden items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] min-[420px]:flex"
      >
        Star on GitHub
      </a>

      <main id="main-content" tabIndex={-1}>
        <VideoEditor />
      </main>

      <footer className="w-full border-t border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-10 text-[var(--text)]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-lg font-semibold tracking-wide">Reframe</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              A private, open-source video editing workspace built for quick format changes.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <h3 className="mb-2 font-medium text-[var(--text)]">Links</h3>

            <a
              href="https://github.com/magic-peach/reframe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] transition-colors duration-200 hover:text-[var(--accent)]"
            >
              GitHub
            </a>

            <a
              href="/contact"
              className="text-[var(--muted)] transition-colors duration-200 hover:text-[var(--accent)]"
            >
              Contact
            </a>

            <a
              href="/privacy"
              className="text-[var(--muted)] transition-colors duration-200 hover:text-[var(--accent)]"
            >
              Privacy Policy
            </a>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <h3 className="font-medium text-[var(--text)]">Stay Connected</h3>

            <div className="flex gap-4">
              <a
                href="https://github.com/magic-peach/reframe"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--muted)] transition-all hover:-translate-y-0.5 hover:text-[var(--accent)]"
                aria-label="Open Reframe on GitHub"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12a12 12 0 008.2 11.38c.6.1.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.08 1.84 2.84 1.31 3.53 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.28-1.55 3.29-1.23 3.29-1.23.67 1.65.26 2.87.13 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.64-5.48 5.93.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.57A12 12 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--muted)]">
          © 2026 Reframe. Open source under the MIT License.
        </div>
      </footer>
    </>
  );
}
