/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#06070d',
        surface: '#10131c',
        'surface-hover': '#161a27',
        accent: '#ff3040',
        'accent-light': '#ff4d5e',
        muted: '#aeb4c7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      aspectRatio: {
        poster: '2 / 3',
      },
    },
  },
  plugins: [],
}
