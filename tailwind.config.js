/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#07050e',
          900: '#0e0b1a',
          800: '#17122b',
          700: '#261c47',
          600: '#3d2b6b',
        },
        neon: {
          pink: '#ff0055',
          cyan: '#00f0ff',
          mint: '#05ffa1',
          amber: '#ffbe0b',
        }
      },
      fontFamily: {
        pixel: ['"VT323"', 'monospace'],
        mono: ['"Space Mono"', 'monospace'],
        code: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}