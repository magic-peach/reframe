import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        sans: ["var(--font-body)", "DM Sans", "sans-serif"],
      },
      colors: {
        // film red — the brand accent
        film: {
          50:  "#fef2f3",
          100: "#fee2e5",
          200: "#fecad0",
          300: "#fca5ae",
          400: "#f87384",
          500: "#ef4455",
          600: "#e63946",
          700: "#c42030",
          800: "#a41828",
          900: "#891726",
        },
      },
      letterSpacing: {
        tightest: "-0.04em",
        widest2: "0.2em",
      },
    },
  },
  plugins: [],
};
export default config;
