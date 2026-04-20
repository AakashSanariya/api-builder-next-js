import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      boxShadow: {
        "premium":     "0 10px 40px -10px rgba(0,0,0,0.05)",
        "premium-lg":  "0 20px 60px -15px rgba(0,0,0,0.1)",
        "indigo-sm":   "0 8px 30px rgba(79,70,229,0.2)",
        "indigo-lg":   "0 20px 60px rgba(79,70,229,0.3)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "dot-grid":
          "radial-gradient(#e5e7eb 1.5px, transparent 1.5px)",
      },
      backgroundSize: {
        "dot-grid": "24px 24px",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};
export default config;
