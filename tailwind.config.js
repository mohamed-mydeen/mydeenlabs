/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        sage: '#A5A79B',
        cream: '#E8D2B5',
        charcoal: '#181818',
        parchment: '#fdfcf9',
        darkbase: '#141414',
        darkcard: '#1a1a1a',
      },
    },
  },
  plugins: [],
};
