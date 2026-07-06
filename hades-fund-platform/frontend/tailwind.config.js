/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14171F',
          soft: '#1E222C',
        },
        paper: {
          DEFAULT: '#F7F6F3',
          dim: '#EFEDE7',
        },
        gold: {
          DEFAULT: '#B8874B',
          soft: '#D9B685',
          deep: '#8C6329',
        },
        wine: {
          DEFAULT: '#6E2A3D',
          soft: '#8C3E52',
        },
        forest: {
          DEFAULT: '#3F6B4F',
          soft: '#5A8A6C',
        },
        slate: {
          DEFAULT: '#5B6270',
          light: '#9297A3',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
