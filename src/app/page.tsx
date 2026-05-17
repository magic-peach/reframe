import VideoEditor from "@/components/VideoEditor";
import {
  Layers, Crop, Scissors, RotateCw, Volume2,
  SlidersHorizontal, Zap, AlertTriangle, Github
} from "lucide-react";
export default function Home() {
  return (
    <>
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 right-16 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[10px] font-heading font-semibold uppercase trac[...]"
      >
        ⭐ Star on GitHub
      </a>

      <main id="main-content" tabIndex={-1}>
        <VideoEditor />
      </main>

      
<footer className="relative w-full mt-auto overflow-hidden border-t border-white/10 bg-[var(--background)]">

  {/* Background Effects */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    
    {/* Glow */}
    <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-film-500/10 blur-3xl animate-pulse" />
    <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />

    {/* Grid */}
    <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] bg-[size:40px_40px]" />

    {/* Floating Dots */}
    <div className="absolute top-10 left-10 h-2 w-2 rounded-full bg-film-400 animate-bounce" />
    <div className="absolute bottom-16 right-16 h-2 w-2 rounded-full bg-purple-400 animate-ping" />
  </div>

  <div className="relative max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-between gap-8">

    {/* LEFT SIDE */}
    <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4">

      {/* Logo + Brand */}
      <div className="flex items-center gap-4">

   

        {/* Text */}
        <div>
          <h2
            className="
             text-2xl font-black tracking-tight text-white to-pink-400
    bg-clip-text text-transparent
            "
          >
            Reframe
          </h2>

          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted)] mt-1">
            Browser Video Studio
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
        Professional video processing directly in your browser using
        <span className="text-film-400 font-medium"> FFmpeg.wasm </span>
        — fast, private, and open source.
      </p>

      {/* Pills */}
      <div className="flex flex-wrap justify-center lg:justify-start gap-2">
        {[
          "No Login",
          "100% Local",
          "Open Source",
          "Fast",
        ].map((item) => (
          <span
            key={item}
            className="
              px-3 py-1 rounded-full
              border border-white/10
              bg-white/5 backdrop-blur-md
              text-[10px] font-medium
              text-[var(--foreground)]
              hover:bg-film-500/10
              hover:border-film-400/40
              hover:-translate-y-0.5
              transition-all duration-300
              cursor-default
            "
          >
            {item}
          </span>
        ))}
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex flex-col items-center lg:items-end gap-4">

      {/* GitHub Card */}
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"
        className="
          group relative overflow-hidden
          rounded-2xl border border-white/10
          bg-white/5 backdrop-blur-xl
          px-5 py-3
          min-w-[240px]
          transition-all duration-500
          hover:-translate-y-1
          hover:border-film-400/40
          hover:shadow-xl hover:shadow-film-500/20
        "
      >
        {/* Shine */}
        <div
          className="
            absolute inset-0
            -translate-x-full
            bg-gradient-to-r from-transparent via-white/10 to-transparent
            group-hover:translate-x-full
            transition-transform duration-1000
          "
        />

        <div className="flex items-center gap-3">

          {/* Icon */}
          <div
            className="
              h-10 w-10 rounded-xl
              bg-gradient-to-br from-film-500 to-purple-500
              flex items-center justify-center
              shadow-lg shadow-film-500/20
              group-hover:rotate-12
              transition-transform duration-500
            "
          >
            <Github size={18} className="text-white" />
          </div>

          {/* Text */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Explore the Source
            </h3>

            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Star the project on GitHub
            </p>
          </div>
        </div>
      </a>

      {/* Local Status */}
      <div
        className="
          flex items-center gap-2
          rounded-full border border-green-500/20
          bg-green-500/10
          px-3 py-1.5
          text-[11px] text-green-400
          backdrop-blur-md
        "
      >
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        Processing happens locally
      </div>

      {/* Bottom Compact Section */}
      <div className="flex flex-col items-center lg:items-end gap-1 text-center lg:text-right">
        <p className="text-[11px] text-[var(--muted)] leading-none">
          © 2025 Reframe. Open source under MIT License.
        </p>

        <a
          href="https://github.com/magic-peach/reframe"
          target="_blank"
          rel="noopener noreferrer"
          className="
            text-[11px]
            text-film-400
            hover:text-film-300
            transition-colors
            flex items-center gap-1
          "
        >
          <Github size={11} />
          View on GitHub
        </a>
      </div>
    </div>
  </div>
</footer>
     
    </>
  );
}