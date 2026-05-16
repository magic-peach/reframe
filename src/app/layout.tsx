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
   keywords: [
    "video editor",
    "browser video editor",
    "open source video editor",
    "resize videos",
    "trim videos",
    "rotate videos",
    "online video editor",
  ],

  authors: [{ name: "Reframe" }],

  openGraph: {
    title: "Reframe",
    description:
      "Free, open-source browser-based video editor. Resize, trim, rotate, and export videos directly in your browser.",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Reframe",
    description:
      "Free, open-source browser-based video editor. Resize, trim, rotate, and export videos directly in your browser.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${syne.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
