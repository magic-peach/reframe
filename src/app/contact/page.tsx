import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Contact — Reframe",
  description: "Get in touch with the Reframe team.",
};
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-8">
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          &larr; Back to Reframe
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-6">Contact</h1>

      <p className="mb-8 text-lg opacity-90">
        Have a question, feedback, or found a bug?
      </p>

      <div className="space-y-6">
        <div>
          <a
            href="https://github.com/magic-peach/reframe/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-[var(--accent)] underline hover:text-[var(--accent-hover)] transition-colors"
          >
            GitHub Issues
          </a>
          <p className="text-[var(--muted)] mt-1">For bug reports and feature requests.</p>
        </div>

        <div>
          <a
            href="https://github.com/magic-peach/reframe/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-[var(--accent)] underline hover:text-[var(--accent-hover)] transition-colors"
          >
            GitHub Discussions
          </a>
          <p className="text-[var(--muted)] mt-1">For questions, ideas, and general help.</p>
        </div>
      </div>
    </main>
  );
}
