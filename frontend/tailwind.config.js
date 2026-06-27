/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        'bme-bg':      '#0a0f1a',
        'bme-card':    '#131e35',
        'bme-surface': '#1a2744',
        'bme-border':  'rgba(99,179,237,0.12)',
      },
      boxShadow: {
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
        'glow-teal':'0 0 20px rgba(20,184,166,0.15)',
        'glow-sm':  '0 0 10px rgba(20,184,166,0.10)',
      },
      animation: {
        'pulse-dot':   'pulse-dot 2s ease-in-out infinite',
        'fade-in-up':  'fade-in-up 0.25s ease-out both',
        'slide-right': 'slide-in-right 0.2s ease-out both',
        'shimmer':     'shimmer 1.5s infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '0.6', transform: 'scale(0.85)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
