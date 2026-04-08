/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enables toggling dark mode manually via a class 
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./App.tsx",
    // Adding src if you use it for common components [cite: 37]
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Custom branding for CarePaws [cite: 13, 53]
        primary: "#2D6A4F",
        neutral: "#AAAAAA",
        white: "#FFFFFF",
        warnBrown: "#D08C60",
        darkBlue: "#1B2A49",
      },
    },
  },
  plugins: [],
};