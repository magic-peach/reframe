import VideoEditor from "@/components/VideoEditor";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <div className="min-h-screen overflow-hidden bg-[#070a12] text-white">
        <div className="absolute inset-x-0 top-0 -z-0 h-[520px] bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.34),transparent_30%),radial-gradient(circle_at_82%_2%,rgba(230,57,70,0.24),transparent_28%),linear-gradient(180deg,#101827_0%,#070a12_78%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl backdrop-blur-xl">
            <a
              href="#editor"
              className="flex items-center gap-3"
              aria-label="Go to Reframe editor"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-950 shadow-lg">
                R
              </span>
              <span>
                <span className="block text-sm font-black tracking-wide text-white">
                  Reframe
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Browser Video Studio
                </span>
              </span>
            </a>

            <nav
              className="hidden items-center gap-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-300 md:flex"
              aria-label="Home page sections"
            >
              <a className="transition hover:text-white" href="#features">
                Features
              </a>
              <a className="transition hover:text-white" href="#editor">
                Editor
              </a>
              <a className="transition hover:text-white" href="#privacy">
                Privacy
              </a>
            </nav>

            <a
              href="https://github.com/magic-peach/reframe"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-white/30 hover:bg-white/15"
            >
              Star on GitHub
            </a>
          </header>

          <section
            id="features"
            className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.06] px-5 py-10 text-center shadow-2xl backdrop-blur-xl sm:px-8 lg:px-14 lg:py-14"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.36em] text-cyan-300">
              Premium local video editing
            </p>

            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              Resize, trim, and export videos without leaving your browser.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Reframe gives creators a private, polished editing workspace for
              social formats, quick trims, rotations, overlays, and exports.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#editor"
                className="rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-100"
              >
                Start Editing
              </a>
              <a
                href="https://github.com/magic-peach/reframe"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-300/10"
              >
                View Source
              </a>
            </div>
          </section>

          <section className="mb-8 grid gap-3 md:grid-cols-3">
            {[
              ["100%", "Local processing"],
              ["Fast", "Browser workflow"],
              ["Social", "Export presets"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 text-center shadow-xl backdrop-blur-xl"
              >
                <p className="text-3xl font-black text-cyan-200">{value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  {label}
                </p>
              </div>
            ))}
          </section>

          <section
            id="privacy"
            className="mb-8 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-5 py-4 text-center text-sm font-semibold text-cyan-100 backdrop-blur-xl"
          >
            No login. No ads. Your video stays on your device.
          </section>

          <section
            id="editor"
            className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-2 shadow-2xl backdrop-blur-xl sm:p-4"
          >
            <VideoEditor />
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
}
