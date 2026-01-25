/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#007AFF",
        "primary-dark": "#005BB5",
        "medical-blue": "#007AFF",
        "success-green": "#34C759",
        "warning-orange": "#FF9500",
        "danger-red": "#FF3B30",
      },
    },
  },
  plugins: [],
};
