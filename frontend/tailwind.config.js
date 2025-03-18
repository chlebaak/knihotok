/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f8d0d7',
          300: '#f2a2b3',
          400: '#e95f7b',
          500: '#db365c',
          600: '#c71d4a',
          700: '#a61339',
          800: '#8b1332',
          900: '#771530',
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
