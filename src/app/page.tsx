import VideoEditor from "@/components/VideoEditor";

export default function Home() {
  return (
    <>
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-heading font-semibold uppercase trac[...]"
      >
        ⭐ Star on GitHub
      </a>
      <VideoEditor />
    </>
  );
}
