import type { Config } from "tailwindcss";

// One specific monochrome theme: black · gray · white only.
// Every accent palette the app used (brand/emerald/rose/sky/…) is remapped to
// this single neutral ramp, so the whole product reads as one grayscale system.
const gray = {
  50: "#fafafa",
  100: "#f4f4f5",
  200: "#e4e4e7",
  300: "#d4d4d8",
  400: "#a1a1aa",
  500: "#71717a",
  600: "#52525b",
  700: "#3f3f46",
  800: "#27272a",
  900: "#18181b",
  950: "#09090b",
};

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware surfaces (CSS variables in globals.css)
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        elevated: "rgb(var(--elevated) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-soft": "rgb(var(--line-soft) / <alpha-value>)",
        content: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        // The single accent: near-black on light, near-white on dark
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-fg": "rgb(var(--accent-fg) / <alpha-value>)",

        // Every previously-colored palette collapses to the same neutral ramp
        brand: gray,
        emerald: gray,
        slate: gray,
        red: gray,
        orange: gray,
        amber: gray,
        rose: gray,
        sky: gray,
        blue: gray,
        violet: gray,
        indigo: gray,
        ink: { 900: "#09090b", 800: "#18181b", 700: "#27272a" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
        lift: "0 12px 34px -14px rgba(0,0,0,0.30)",
      },
      backgroundImage: {
        // Graphite gradient for filled buttons — quiet, works with white text in both themes
        "brand-sheen": "linear-gradient(135deg, #3f3f46 0%, #27272a 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
