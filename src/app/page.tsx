import VideoEditor from "@/components/VideoEditor";
import { ExportSoundToggle } from "@/components/settings/ExportSoundToggle"; // Check this path!

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* GitHub Star Button */}
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-heading font-semibold uppercase trac[...]"
      >
        ⭐ Star on GitHub
      </a>

      {/* --- ADD THIS SECTION --- */}
      <div className="max-w-4xl mx-auto pt-20 px-6">
        <div className="flex justify-end mb-4">
          <ExportSoundToggle />
        </div>
        
        <VideoEditor />
      </div>
    </main>
  );
}
