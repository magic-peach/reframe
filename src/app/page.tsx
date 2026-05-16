import VideoEditor from "@/components/VideoEditor";

export default function Home() {
  return (
    <>
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-heading font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-film-600 hover:border-film-400 transition-all duration-200 shadow-sm"
      >
        ⭐ Star on GitHub
      </a>
        <VideoEditor />
        <footer className="text-center text-gray-500 text-sm py-4">
        <p>© 2025 Reframe. Open source under MIT License.</p>
        <a href="https://github.com/magic-peach/reframe" target="_blank" rel="noopener noreferrer" className="hover:underline">
          View on GitHub
        </a>
      </footer>
    </>  
  );
}
