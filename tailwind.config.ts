import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        forest: {
          50: "#F0F9F3",
          100: "#E0F2E7",
          200: "#C1E5D0",
          300: "#92D0AE",
          400: "#5CB386",
          500: "#369763",
          600: "#27794D",
          700: "#1E5E3D",
          800: "#1A4C32",
          900: "#0F3824",
          950: "#042618",
        },
        warm: {
          50: "#FAF9F5",
          100: "#F5F3EB",
          200: "#EBE7DC",
          300: "#DED8C7",
          400: "#CAC1A9",
          500: "#B3A78A",
          600: "#95896E",
          700: "#756B55",
          800: "#574F3F",
          900: "#3D372C",
        },
        mint: {
          50: "#F4FAF6",
          100: "#E5F4EC",
          200: "#CEE9DC",
          300: "#A7D7C1",
          400: "#79BFA2",
        },
        sage: {
          50: "#F6F8F6",
          100: "#E9EEE9",
          200: "#D5DED5",
          300: "#B8C7B8",
          400: "#96A996",
        }
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -2px rgba(4, 38, 24, 0.04), 0 1px 4px -1px rgba(4, 38, 24, 0.02)',
        'warm-md': '0 8px 24px -4px rgba(4, 38, 24, 0.06), 0 2px 6px -2px rgba(4, 38, 24, 0.04)',
        'warm-lg': '0 16px 36px -6px rgba(4, 38, 24, 0.08), 0 4px 12px -2px rgba(4, 38, 24, 0.04)',
        'warm-hover': '0 20px 40px -8px rgba(4, 38, 24, 0.12), 0 6px 16px -4px rgba(4, 38, 24, 0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
