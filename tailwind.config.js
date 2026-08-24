/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
