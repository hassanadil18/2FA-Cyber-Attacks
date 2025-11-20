/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff5f7',
          100: '#ffe3e8',
          200: '#ffc7d1',
          300: '#ff99aa',
          400: '#ff5c7c',
          500: '#e94560',
          600: '#d63a54',
          700: '#b32f46',
          800: '#8f2638',
          900: '#6b1d2a',
        },
        dark: {
          50: '#f5f5f7',
          100: '#e0e0e5',
          200: '#c1c1ca',
          300: '#8f8f9d',
          400: '#5d5d70',
          500: '#1a1a2e',
          600: '#16162a',
          700: '#121226',
          800: '#0f0f1e',
          900: '#0a0a15',
        },
        danger: {
          50: '#fff5f7',
          500: '#e94560',
          600: '#d63a54',
          700: '#b32f46',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      }
    },
  },
  plugins: [],
}