import type { Metadata } from "next";
import { Bebas_Neue, Syne, DM_Sans } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";


export const metadata: Metadata = {
  title: "Reframe — Resize, trim, and export videos in your browser",
  description:
    "Free, open-source video editor that runs entirely in your browser. No login, no uploads, no ads. Resize for any platform, trim, rotate, adjust speed, and export.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = stored === 'dark' || (!stored && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>

      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <ThemeProvider>
          <ErrorBoundary>
            <header
              role="banner"
              className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg)]"
            >
              <h1 className="text-lg font-semibold">Reframe</h1>
              <ThemeToggle />
            </header>

            <main role="main" id="main-content">
              {children}
            </main>

            <footer
              role="contentinfo"
              className="px-6 py-4 text-sm text-[var(--muted)]"
            >
              <p>© 2026 Reframe</p>
            </footer>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}