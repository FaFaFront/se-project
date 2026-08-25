import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)"],
        outfit: ["var(--font-outfit)"],
      },
      fontSize: {
        "display-xl": ["80px", { lineHeight: "87px", fontWeight: "700" }],
        "display-lg": ["40px", { lineHeight: "50px", fontWeight: "700" }],
        "display-md": ["30px", { lineHeight: "37px", fontWeight: "700" }],
        "heading-md": ["24px", { lineHeight: "30px", fontWeight: "700" }],
        "heading-sm": ["24px", { lineHeight: "32px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "28px", fontWeight: "400" }],
        "body-emphasis": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        caption: ["14px", { lineHeight: "21px", fontWeight: "400" }],
        "button-md": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "nav-link": ["14px", { lineHeight: "20px", fontWeight: "400" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "10px",
        base: "16px",
        lg: "22px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "40px",
        "4xl": "80px",
      },
      colors: {
        primary: "rgb(var(--primary-rgb) / <alpha-value>)",
        "brand-plum": "var(--brand-plum)",
        "brand-plum-dark": "var(--brand-plum-dark)",
        "brand-plum-deepest": "var(--brand-plum-deepest)",
        "brand-ultra-dark": "var(--brand-ultra-dark)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        "ink-link": "var(--ink-link)",
        "ink-black": "rgb(var(--ink-black-rgb) / <alpha-value>)",
        placeholder: "var(--placeholder)",
        canvas: "var(--canvas)",
        "surface-lavender": "var(--surface-lavender)",
        "surface-disabled": "var(--surface-disabled)",
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
