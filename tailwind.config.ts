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
          50: "var(--accent-muted)",
          100: "var(--accent-muted)",
          200: "color-mix(in srgb, var(--accent) 30%, var(--border))",
          300: "color-mix(in srgb, var(--accent) 55%, var(--border))",
          400: "var(--accent)",
          500: "var(--accent)",
          600: "var(--accent)",
          700: "var(--accent-hover)",
          800: "var(--text)",
          900: "var(--text)",
          950: "var(--bg)",
        },
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px -5px var(--glow-color)" },
          "50%": { boxShadow: "0 0 30px -3px var(--glow-color)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "fade-in": "fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) both",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) both",
        "slide-up": "slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) both",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
      boxShadow: {
        "card": "var(--card-shadow)",
        "card-hover": "var(--card-shadow-hover)",
        "glow": "0 0 20px -5px var(--glow-color)",
        "glow-lg": "0 0 40px -8px var(--glow-color)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
