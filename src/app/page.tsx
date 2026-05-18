import VideoEditor from "@/components/VideoEditor";

export default function Home() {
  return (
    <>
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden min-[300px]:flex fixed top-4 right-16 z-50 items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-heading font-semibold uppercase tracking-wider hover:bg-opacity-90 transition-all"      >
        ⭐ Star on GitHub
      </a>

      <main id="main-content" tabIndex={-1}>
        <VideoEditor />
      </main>

      <footer className="w-full border-t border-white/10 bg-gradient-to-b from-[#0A2239] to-[#132E32] text-white px-6 py-10 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left Section */}
          <div>
            <h2 className="text-lg font-semibold tracking-wide">Reframe</h2>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              A modern open-source video editing experience built for creators.
            </p>
          </div>

          {/* Middle Section */}
          <div className="flex flex-col gap-2 text-sm">
            <h3 className="font-medium text-gray-300 mb-2">Links</h3>

            <a
              href="https://github.com/magic-peach/reframe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors duration-200"
            >
              GitHub
            </a>

            <a
              href="/contact"
              className="hover:text-blue-400 transition-colors duration-200"
            >
              Contact
            </a>

            <a
              href="/privacy"
              className="hover:text-blue-400 transition-colors duration-200"
            >
              Privacy Policy
            </a>
          </div>

          {/* Right Section */}
          <div className="flex flex-col gap-3 md:items-end">
            <h3 className="font-medium text-gray-300">Stay Connected</h3>

            <div className="flex gap-4">
              <a
                href="https://github.com/magic-peach/reframe"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                {/* GitHub Icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12a12 12 0 008.2 11.38c.6.1.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.08 1.84 2.84 1.31 3.53 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.94 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.28-1.55 3.29-1.23 3.29-1.23.67 1.65.26 2.87.13 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.64-5.48 5.93.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.57A12 12 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
          © 2026 Reframe · Open Source under MIT License
        </div>
      </footer>
    </>
  );
}