import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Edit Videos Directly in Your Browser
        </h1>

        <p className="max-w-2xl text-lg md:text-xl mb-8">
          Fast, private, and free video editing.
          No uploads. No login.
          Your files never leave your device.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#features"
            className="px-6 py-3 rounded-lg border"
          >
            Get Started
          </a>

          <Link
            href="/editor"
            className="px-6 py-3 rounded-lg bg-black text-white"
          >
            Open Editor
          </Link>

          <a
            href="https://github.com/magic-peach/reframe"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg border"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-12">
          Powerful Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">⚡ Fast Processing</h3>
            <p>Edit and export videos directly in your browser.</p>
          </div>

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">🔒 100% Private</h3>
            <p>Your files stay on your device.</p>
          </div>

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">🎬 Multiple Export Formats</h3>
            <p>Export videos in MP4, WebM, MKV and GIF.</p>
          </div>

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">📱 Responsive Design</h3>
            <p>Works across desktop, tablet and mobile devices.</p>
          </div>

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">🎨 Easy Editing</h3>
            <p>Trim, resize, rotate and customize videos easily.</p>
          </div>

          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">💾 Client-Side Processing</h3>
            <p>All processing happens directly in your browser.</p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-12">
          Privacy First
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">🚫 No Uploads</h3>
            <p>Your videos are never uploaded to external servers.</p>
          </div>

          <div className="p-6 border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">🔑 No Login</h3>
            <p>Start editing instantly without creating an account.</p>
          </div>

          <div className="p-6 border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">💻 Client-Side Processing</h3>
            <p>All video processing happens in your browser.</p>
          </div>

          <div className="p-6 border rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-2">🛡️ Your Data Stays Yours</h3>
            <p>Files remain on your device and under your control.</p>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Edit Your Videos?
        </h2>

        <p className="max-w-2xl mx-auto text-lg mb-8">
          Start editing instantly with Reframe.
        </p>

        <Link
          href="/editor"
          className="inline-block px-8 py-4 rounded-xl bg-black text-white font-semibold"
        >
          Open Editor
        </Link>
      </section>
    </main>
  );
}