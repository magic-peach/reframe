"use client";

import Link from "next/link";
import { Home, Film } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "var(--bg)" }}
    >
      <div className="mb-8">
        <Film size={64} className="text-film-400 mx-auto mb-4" />
        <h1 className="font-display text-8xl leading-none tracking-widest2 text-[var(--text)]">
          404
        </h1>
      </div>

      <h2 className="font-heading font-bold text-2xl text-[var(--text)] mb-3">
        Page Not Found
      </h2>

      <p className="text-[var(--muted)] max-w-md mb-8">
        Looks like this frame doesn&apos;t exist. The page you&apos;re looking for
        may have been moved or deleted.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-film-600 text-white
                   font-heading font-semibold rounded-xl hover:bg-film-700
                   transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Home size={18} />
        Back to Editor
      </Link>
    </div>
  );
}
