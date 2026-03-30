/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        fret: {
          bg: "#1a1a1a",
          border: "#3a3a3a",
          marker: "#555555",
          string: "#888888",
        },
      },
    },
  },
  plugins: [],
};
