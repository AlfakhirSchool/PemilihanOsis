import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        teal: '#125E63',
        'teal-dark': '#0E464A',
        gold: '#FAC760',
        'gold-dark': '#DA9407',
        cream: '#FFF1C2',
      },
    },
  },
  plugins: [],
} satisfies Config;
