/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { forest: "#12372a", leaf: "#1f7a5b", sand: "#f8f4eb", sun: "#f4a261" },
      fontFamily: { sans: ["Noto Sans Thai", "Noto Sans SC", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
