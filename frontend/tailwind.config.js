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
          darker: "#090d16",
          dark: "#0f172a",
          card: "#131c31",
          cardBorder: "#1e293b",
          muted: "#94a3b8",
          accent: "#06b6d4",
          accentHover: "#0891b2",
        },
        risk: {
          low: "#10b981",
          lowBg: "rgba(16, 185, 129, 0.12)",
          medium: "#f59e0b",
          mediumBg: "rgba(245, 158, 11, 0.12)",
          high: "#ef4444",
          highBg: "rgba(239, 68, 68, 0.12)",
          critical: "#dc2626",
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