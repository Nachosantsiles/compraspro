import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tomalar: {
          DEFAULT: "#185FA5",
          50: "#EBF3FB",
          100: "#C2D9F0",
          200: "#99BEE5",
          300: "#70A4DA",
          400: "#4789CF",
          500: "#185FA5",
          600: "#134E87",
          700: "#0E3D6A",
          800: "#092B4C",
          900: "#041A2E",
        },
        seville: {
          DEFAULT: "#3B6D11",
          50: "#EBF3E3",
          100: "#C8DFB4",
          200: "#A5CB85",
          300: "#82B756",
          400: "#5F9E27",
          500: "#3B6D11",
          600: "#2E550D",
          700: "#223E09",
          800: "#152705",
          900: "#091001",
        },
        fincas: {
          DEFAULT: "#854F0B",
          50: "#F8EFE4",
          100: "#EDD3B2",
          200: "#E2B880",
          300: "#D79C4E",
          400: "#CC811C",
          500: "#854F0B",
          600: "#6B3F09",
          700: "#522F07",
          800: "#381F04",
          900: "#1E1002",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
