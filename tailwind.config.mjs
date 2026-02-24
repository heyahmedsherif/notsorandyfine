/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8ecf4',
          100: '#c5cfe3',
          200: '#9eafd0',
          300: '#778fbd',
          400: '#5977ae',
          500: '#3b5f9f',
          600: '#2d4d87',
          700: '#1f3b6f',
          800: '#1a365d',
          900: '#0f1f38',
        },
        accent: {
          red: '#dc2626',
          'red-dark': '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
