import Link from "next/link";
import { Film } from "lucide-react";

export default  function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 animate-fade-in px-4">
      <div className="flex items-center gap-2 text-film-500">
        <Film size={28} />
        <span className="font-display text-2xl tracking-widest">REFRAME</span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="font-display text-[6rem] leading-none text-[var(--text)]">404</h1>
        <p className="font-heading text-lg text-[var(--muted)]">Page not found</p>
      </div>

      <div className="h-px w-16 bg-[var(--border)]" />

      <Link
        href="/"
        className="font-heading text-sm font-semibold px-5 py-2.5 rounded-lg bg-film-500 text-white hover:bg-film-600 transition-colors"
      >
        Go back to Reframe
      </Link>
    </div>
  );
}
