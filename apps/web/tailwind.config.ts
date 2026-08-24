import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)"],
        outfit: ["var(--font-outfit)"],
        "ibm-plex-sans-thai": ["var(--font-ibm-plex-sans-thai)"],
      },
      colors: {
        primary: "var(--primary)",
        "brand-plum": "var(--brand-plum)",
        "brand-plum-dark": "var(--brand-plum-dark)",
        "brand-plum-deepest": "var(--brand-plum-deepest)",
        "brand-ultra-dark": "var(--brand-ultra-dark)",
        ink: "var(--ink)",
        "ink-link": "var(--ink-link)",
        "ink-black": "var(--ink-black)",
        placeholder: "var(--placeholder)",
        canvas: "var(--canvas)",
        "surface-lavender": "var(--surface-lavender)",
        hairline: "var(--hairline)",
        error: "var(--error)",
        success: "var(--success)",
      },
      boxShadow: {
        cta: "var(--shadow-cta)",
        sm: "var(--shadow-sm)",
      },
    },
  },
  plugins: [],
};

export default config;
