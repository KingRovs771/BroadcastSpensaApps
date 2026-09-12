import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          DEFAULT: "#030712",
          canvas: "#030712",
        },
        surface: {
          1: "#0B132B",
          2: "#111C3B",
          3: "#1E293B",
        },
        // High-contrast spectrum — verified ≥7.9:1 as TEXT on #030712,
        // and ≥7.9:1 with dark #030712 text on solid fill. NEVER use
        // white text on these fills (white-on-fill fails: 1.9–2.5:1).
        spectrum: {
          gold: "#FCD34D", // 14.0:1
          amber: "#FBBF24", // 12.1:1
          tangerine: "#FDBA74", // 11.9:1 (old #E86A33 was ~6.3:1, weak at 10px)
          mandarin: "#FB923C", // 8.9:1
          jade: "#34D399", // 10.5:1
          cyan: "#7DD3FC", // 12.1:1 (old #2B9EB3 was ~6.4:1, weak at 10px)
          cobalt: "#60A5FA", // 7.9:1 (old #2E63B8 FAILED at ~3.5:1)
          danger: "#FCA5A5", // 10.6:1 red text for dark bg
        },
        orbital: {
          violet: "#C4B5FD", // 10.9:1 (old #8B3DA8 FAILED at ~3.2:1)
          magenta: "#F0ABFC", // 11.4:1 (old #B253B8 was ~4.6:1, failed small text)
        },
        // Solid fills pair ONLY with ink text #030712 (ratio in comment).
        ink: {
          DEFAULT: "#030712",
        },
        studio: {
          border: {
            subtle: "rgba(255, 255, 255, 0.12)",
            medium: "rgba(255, 255, 255, 0.24)",
            orbital: "rgba(196, 181, 253, 0.45)",
          },
          text: {
            primary: "#FFFFFF", // 20.1:1
            secondary: "#CBD5E1", // 13.6:1
            muted: "#94A3B8", // 7.9:1 (old #64748B FAILED at ~4.2:1) — min 11px
            inverse: "#030712",
          },
        },
      },
      fontFamily: {
        brand: ["var(--font-brand)", "Cinzel", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-mono)", "Geist Mono", "monospace"],
      },
      boxShadow: {
        orbital: "0 0 25px -5px rgba(178, 83, 184, 0.3)",
        jade: "0 0 20px -3px rgba(44, 165, 121, 0.35)",
        amber: "0 0 20px -3px rgba(245, 183, 56, 0.35)",
        cyan: "0 0 20px -3px rgba(43, 158, 179, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
