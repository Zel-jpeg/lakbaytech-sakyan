/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef1fe',
          100: '#dde4fd',
          200: '#bbc9fb',
          300: '#99aef9',
          400: '#7793f7',
          500: '#4F6BF6',
          600: '#3f56c5',
          700: '#2f4094',
          800: '#202b63',
          900: '#101531',
        },
        /* Note: surface-dark colors are used as arbitrary values in CSS
           to avoid Tailwind v3 @apply parsing issues with 'dark' in color names */
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 40px rgba(79,107,246,0.12), 0 4px 12px rgba(0,0,0,0.05)',
        'glass':     '0 8px 32px rgba(0,0,0,0.08)',
        'glow':      '0 0 20px rgba(79,107,246,0.25)',
        'dark-card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'dark-card-hover': '0 10px 40px rgba(79,107,246,0.2), 0 4px 12px rgba(0,0,0,0.3)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}