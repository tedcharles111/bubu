/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['"Bebas Neue"', 'sans-serif'],
        rajdhani: ['"Rajdhani"', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'shake': 'shake 0.2s ease-in-out',
        'fatality': 'fatality 0.5s ease-in-out',
        'pulse-slow': 'pulse-slow 8s infinite ease-in-out', // New animation for welcome page
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '50%': { transform: 'translateX(5px)' },
          '75%': { transform: 'translateX(-5px)' },
        },
        'fatality': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.05' },
          '50%': { opacity: '0.15' },
        },
      },
    },
  },
  plugins: [],
};