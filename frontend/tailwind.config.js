/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        safety: {
          green: '#10B981',
          amber: '#F59E0B',
          orange: '#F97316',
          red: '#EF4444',
          darkRed: '#B91C1C',
        },
        navy: {
          900: '#0B132B',
          800: '#1C2541',
          700: '#3A506B',
          600: '#475569',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
