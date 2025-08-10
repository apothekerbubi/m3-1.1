import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#bddcff",
          300: "#8bc0ff",
          400: "#56a4ff",
          500: "#2b8aff",
          600: "#0f6fe6",
          700: "#0758b8",
          800: "#064895",
          900: "#083b78",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "ui-sans-serif", "Arial"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08)",
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};
export default config;