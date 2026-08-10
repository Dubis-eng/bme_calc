/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      colors: {
        /* ── Light Mode Surfaces ── */
        'bme-app':     '#F8FAFB',
        'bme-surface': '#FFFFFF',
        'bme-muted':   '#F3F4F6',
        'bme-border':  '#E5E7EB',
        'bme-border-strong': '#D1D5DB',

        /* ── Text ── */
        'bme-text':     '#111827',
        'bme-text-sec': '#6B7280',
        'bme-text-muted': '#9CA3AF',

        /* ── Accent: Teal (acción principal) ── */
        'bme-teal':       '#0D9488',
        'bme-teal-light': '#CCFBF1',
        'bme-teal-mid':   '#14B8A6',

        /* ── Accent: Indigo (secundário) ── */
        'bme-indigo':       '#4F46E5',
        'bme-indigo-light': '#EEF2FF',

        /* ── Estado: Tipos de variável ── */
        'bme-amber':   '#F59E0B',
        'bme-emerald': '#10B981',
        'bme-rose':    '#F43F5E',
        'bme-violet':  '#7C3AED',
        'bme-cyan':    '#06B6D4',

        /* ── Sidebar (mantida com tom neutro escuro suave) ── */
        'sidebar-bg':     '#1E2028',
        'sidebar-border': 'rgba(255,255,255,0.06)',
        'sidebar-text':   '#A1A5B0',
        'sidebar-active': '#FFFFFF',
      },

      boxShadow: {
        'sm':      '0 1px 2px rgba(0,0,0,0.05)',
        'md':      '0 4px 12px rgba(0,0,0,0.08)',
        'lg':      '0 8px 24px rgba(0,0,0,0.10)',
        'drawer':  '-4px 0 24px rgba(0,0,0,0.12)',
        'input':   '0 1px 2px rgba(0,0,0,0.04)',
        'btn':     '0 2px 8px rgba(13,148,136,0.30)',
        'card':    '0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)',
      },

      animation: {
        'pulse-dot':    'pulse-dot 2s ease-in-out infinite',
        'fade-in-up':   'fade-in-up 0.22s ease-out both',
        'slide-right':  'slide-in-right 0.2s ease-out both',
        'drawer-in':    'drawer-in 0.28s cubic-bezier(0.22,1,0.36,1) both',
        'drawer-out':   'drawer-out 0.22s ease-in both',
        'shimmer':      'shimmer 1.5s infinite',
        'check-in':     'check-in 0.3s ease-out both',
      },

      keyframes: {
        'pulse-dot': {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '0.6', transform: 'scale(0.85)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'drawer-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        'drawer-out': {
          from: { transform: 'translateX(0)',    opacity: '1' },
          to:   { transform: 'translateX(100%)', opacity: '0' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'check-in': {
          from: { opacity: '0', transform: 'scale(0.7)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
