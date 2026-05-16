import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        amber: { DEFAULT: "#f59e0b", dim: "#f59e0b22", glow: "#f59e0b44" },
        surface: { DEFAULT: "#111118", card: "#16161f", hover: "#1c1c28" },
        border: { DEFAULT: "#ffffff0f", accent: "#f59e0b33" },
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
