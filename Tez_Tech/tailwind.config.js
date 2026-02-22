/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Ye line sabse zaroori hai
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // Indigo
        secondary: "#a855f7", // Purple
        dark: "#0f172a", // Dark Slate
      },
    },
  },
  plugins: [],
}