import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Enable class-based dark mode
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Added files to catch utility strings hidden in hooks, providers, or custom UI state contexts
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        film: {
          50: "var(--film-50)",
          100: "var(--film-100)",
          200: "var(--film-200)",
          300: "var(--film-300)",
          400: "var(--film-400)",
          500: "var(--film-500)",
          600: "var(--film-600)",
          700: "var(--film-700)",
          800: "var(--film-800)",
          900: "var(--film-900)",
          950: "var(--film-950)",
        },
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
