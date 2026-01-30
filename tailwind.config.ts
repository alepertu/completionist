import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent-neon, #64748b)",
      },
      boxShadow: {
        glow: "0 0 12px var(--accent-neon, #64748b)",
      },
    },
  },
  plugins: [],
};

export default config;
