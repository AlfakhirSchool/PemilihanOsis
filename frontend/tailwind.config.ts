import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        biru: '#1565C0',
        oranye: '#FF9800',
        teal: '#00897B',
      },
    },
  },
  plugins: [],
} satisfies Config;
