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
        'bme-bg':      'hsl(220, 40%, 7%)',
        'bme-bg-sec':  'hsl(222, 38%, 11%)',
        'bme-card':    'hsl(221, 36%, 15%)',
        'bme-surface': 'hsl(220, 34%, 19%)',

        /* Accent palette */
        'bme-teal':    'hsl(172, 66%, 40%)',
        'bme-cyan':    'hsl(189, 94%, 43%)',
        'bme-emerald': 'hsl(152, 69%, 40%)',
        'bme-amber':   'hsl(38,  92%, 50%)',
        'bme-rose':    'hsl(347, 89%, 60%)',

        /* Text */
        'bme-text':       'hsl(214, 32%, 91%)',
        'bme-text-sec':   'hsl(215, 20%, 65%)',
        'bme-text-muted': 'hsl(215, 25%, 40%)',
      },

      boxShadow: {
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'surface':    '0 8px 32px rgba(0,0,0,0.5)',
        'glow-teal':  '0 0 20px rgba(20,184,166,0.15)',
        'glow-lg':    '0 0 40px rgba(20,184,166,0.10)',
        'glow-hover': '0 0 30px rgba(20,184,166,0.40), 0 0 60px rgba(20,184,166,0.15)',
      },

      backgroundImage: {
        'spotlight': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(20,184,166,0.06) 0%, transparent 70%)',
      },

      animation: {
        'pulse-dot':   'pulse-dot 2s ease-in-out infinite',
        'fade-in-up':  'fade-in-up 0.25s ease-out both',
        'slide-right': 'slide-in-right 0.2s ease-out both',
        'shimmer':     'shimmer 1.5s infinite',
        'glow-pulse':  'glow-pulse 2.5s ease-in-out infinite',
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
        'glow-pulse': {
          '0%,100%': { boxShadow: '0 0 20px rgba(20,184,166,0.15)' },
          '50%':     { boxShadow: '0 0 30px rgba(20,184,166,0.30)' },
        },
      },
    },
  },
  plugins: [],
};
