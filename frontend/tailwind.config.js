/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          darker: "#f8fafc",
          dark: "#ffffff",
          card: "#ffffff",
          cardBorder: "#e2e8f0",
          muted: "#64748b",
          accent: "#0891b2",
          accentHover: "#0e7490",
        },
        risk: {
          low: "#059669",
          lowBg: "rgba(16, 185, 129, 0.12)",
          medium: "#d97706",
          mediumBg: "rgba(245, 158, 11, 0.12)",
          high: "#dc2626",
          highBg: "rgba(239, 68, 68, 0.12)",
          critical: "#b91c1c",
          criticalBg: "rgba(220, 38, 38, 0.18)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
}