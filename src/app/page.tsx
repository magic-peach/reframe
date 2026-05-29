import VideoEditor from "@/components/VideoEditor";
import Footer from "@/components/Footer"; 

export default function Home() {
  return (
    <>
      <a
        href="https://github.com/magic-peach/reframe"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden min-[300px]:flex fixed top-4 right-16 z-50 items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 glass-card text-[10px] font-heading font-semibold uppercase tracking-wider transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:bg-white/10"      >
        ⭐ Star on GitHub
      </a>

      <main
        id="main-content"
        tabIndex={-1}
        className="relative overflow-hidden min-h-screen"
      >
        {/* Background Glow Effects */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl animate-glow" />
      
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl animate-glow" />
      
          <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-3xl animate-float" />
        </div>
      
        <VideoEditor />
      </main>

      <Footer />
    </>
  );
}
    
