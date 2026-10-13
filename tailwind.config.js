/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./Presentation.jsx", "./src/**/*.{js,jsx}"],
  safelist: [
    "bg-indigo-100", "text-indigo-700",
    "bg-emerald-100", "text-emerald-700",
    "bg-amber-100", "text-amber-700",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
