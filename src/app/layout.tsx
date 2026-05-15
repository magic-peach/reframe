import type { Metadata } from "next";
import { Bebas_Neue, Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reframe — Resize, trim, and export videos in your browser",
  description: "Free, open-source video editor that runs entirely in your browser. No login, no uploads, no ads. Resize for any platform, trim, rotate, adjust speed, and export.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${syne.variable} ${dmSans.variable}`}>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black">
            Skip to main content
          </a>
        <header>
          <h1>Reframe</h1>
        </header>
        <main id="main-content">
          {children}
        </main>
        <footer>
          <p>© 2026 Reframe</p>
        </footer>
      </body>
    </html>
  );
}
