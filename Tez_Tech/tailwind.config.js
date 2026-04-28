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
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
      }
    },
  },
  plugins: [],
}