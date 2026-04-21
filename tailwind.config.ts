import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6D28D9',
          light: '#8B5CF6',
          dark: '#5B21B6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
