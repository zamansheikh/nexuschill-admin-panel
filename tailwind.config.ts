import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        // `--font-sans` is wired in app/layout.tsx via next/font (Inter).
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          light: '#8B5CF6',
          dark: '#5B21B6',
        },
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card': '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 8px 24px -8px rgb(15 23 42 / 0.08)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #8B5CF6 100%)',
        'mesh-gradient':
          'radial-gradient(at 20% 0%, #ede9fe 0px, transparent 50%), radial-gradient(at 80% 0%, #c4b5fd 0px, transparent 50%), radial-gradient(at 0% 100%, #ddd6fe 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};

export default config;
