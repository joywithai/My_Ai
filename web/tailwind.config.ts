import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080808",
        panel: "rgba(255,255,255,0.03)",
        line: "#232329",
        accent: "#a78bfa",
        "accent-dim": "rgba(167,139,250,0.15)",
        txt: "#f0f0f0",
        muted: "#8a8a8a",
        ok: "#34d399",
        err: "#f87171",
        warn: "#fbbf24",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["Fira Code", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
