/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          100: "#F4E1E6",
          600: "#800020",
          800: "#5A001B",
        },
        'primary': '#2e0003',
        'secondary': '#C7253E',
        'third': '#E85C0D',
        'fourth': '#FABC3F',
        

    },
  },
  plugins: [],
}
}
