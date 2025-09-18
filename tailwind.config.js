/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f3ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#007cdb',
          600: '#0066b3',
          700: '#004d8a',
          800: '#003362',
          900: '#001a39',
        },
        secondary: {
          50: '#f3e6ff',
          100: '#d9b3ff',
          200: '#bf80ff',
          300: '#a64dff',
          400: '#8c1aff',
          500: '#8403b7',
          600: '#6b0296',
          700: '#520275',
          800: '#390154',
          900: '#200133',
        },
      },
    },
  },
  plugins: [],
};
