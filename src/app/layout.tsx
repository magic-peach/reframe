import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "My App",
  description: "Dark mode enabled app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
         * Inline script runs BEFORE React hydrates, preventing
         * a flash of the wrong theme (FOUC).
         * It reads localStorage first, then falls back to
         * the OS prefers-color-scheme preference.
         */}
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
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ThemeProvider>
          {/* Global nav bar with toggle */}
          <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[var(--card-border)] bg-[var(--background)]">
            <span className="font-semibold text-lg tracking-tight">MyApp</span>
            <ThemeToggle />
          </header>

          <main className="px-6 py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
