import type { Config } from "tailwindcss";

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
        // Semantic, theme-aware surfaces (driven by CSS variables in globals.css)
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        elevated: "rgb(var(--elevated) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-soft": "rgb(var(--line-soft) / <alpha-value>)",
        content: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",

        ink: {
          900: "#0b1220",
          800: "#111a2e",
          700: "#1b2540",
        },
        brand: {
          50: "#eef0ff",
          100: "#e0e3ff",
          200: "#c7ccff",
          400: "#8b8cf7",
          500: "#6d6af5",
          600: "#5a53ec",
          700: "#4a42d4",
        },
        emerald: {
          50: "#ecfdf5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        lift: "0 12px 34px -14px rgba(37,33,120,0.30)",
        glow: "0 0 0 1px rgb(var(--line) / 1), 0 18px 50px -22px rgba(37,33,120,0.45)",
      },
      backgroundImage: {
        "brand-sheen": "linear-gradient(135deg, #6d6af5 0%, #5a53ec 55%, #10b981 140%)",
      },
    },
  },
  plugins: [],
};

export default config;
