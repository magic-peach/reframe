import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm opacity-70 hover:opacity-100 transition-opacity"
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
            className="text-lg font-semibold underline hover:opacity-80 transition-opacity"
          >
            GitHub Issues
          </a>
          <p className="opacity-70 mt-1">For bug reports and feature requests.</p>
        </div>

        <div>
          <a
            href="https://github.com/magic-peach/reframe/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold underline hover:opacity-80 transition-opacity"
          >
            GitHub Discussions
          </a>
          <p className="opacity-70 mt-1">For questions, ideas, and general help.</p>
        </div>
      </div>
    </main>
  );
}
