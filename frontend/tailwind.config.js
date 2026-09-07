/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        themeBg: "#F6FBF7",
        themeSurface: "#FFFFFF",
        primaryGreen: "#4CAF72",
        lightGreen: "#DDF3E4",
        softMint: "#EEF9F1",
        darkGreen: "#2F7D4A",
        accentGreen: "#86D39B",
        primaryText: "#1F2933",
        secondaryText: "#6B7280",
        themeBorder: "#E3EEE6",
        success: "#4CAF72",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: {
        card: "18px",
        btn: "12px",
        input: "11px",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(47, 125, 74, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.02)",
        hover: "0 10px 25px -4px rgba(47, 125, 74, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)",
      }
    },
  },
  plugins: [],
}
