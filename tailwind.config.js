/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#FDFBF7",
        sage: {
          DEFAULT: "#87A96B",
          light: "#A8C68F",
          dark: "#6B8A52",
        },
        charcoal: {
          DEFAULT: "#4A4A4A",
          light: "#6E6E6E",
          muted: "#9A9A9A",
        },
      },
    },
  },
  plugins: [],
};
