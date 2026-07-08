import type { Config } from "tailwindcss";

const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#D4AF37",
        secondary: "#A52A2A",
        tertiary: "#97B0FF",
        "neutral-custom": "#7C766B",
        background: "#0A0A0A",
      },
      fontFamily: {
        headline: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
        body: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        heading: ["var(--font-heading)", "Montserrat", "sans-serif"],
        sans: ["var(--font-sans)", "DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
