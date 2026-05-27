import VideoEditor from "@/components/VideoEditor";
import PrivacyBanner from "@/components/PrivacyBanner";

import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"


        className="hidden min-[300px]:flex fixed top-4 right-16 z-50 items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-heading font-semibold uppercase tracking-wider transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-[0_0_10px_rgba(255,255,255,0.15)] hover:bg-white/10"

        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-heading font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-film-600 hover:border-film-400 transition-all duration-200 shadow-sm"


        className="hidden min-[300px]:flex fixed top-4 right-16 z-50 items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-heading font-semibold uppercase tracking-wider transition-all duration-200 ease-in-out hover:scale-105 hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] hover:shadow-[var(--shadow)]"

      >
        ⭐ Star on GitHub
      </a>

      <main className="flex-1">
        <PrivacyBanner />
        <VideoEditor />
      </main>
    </div>
  );
}
