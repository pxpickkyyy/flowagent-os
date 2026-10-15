/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#050505',
        substrate: '#05070D',
        'card-dark': '#090D18',
        'card-inner': '#0D1322',
        hazard: {
          DEFAULT: '#FF2A2A',
          dark: '#990000',
          glow: 'rgba(255, 42, 42, 0.4)',
        },
        phosphor: {
          cyan: '#00F0FF',
          green: '#4AF626',
          amber: '#FFB800',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.32, 0.72, 0, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        'bezel-outer': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 40px -15px rgba(0, 0, 0, 0.8)',
        'bezel-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4)',
        'phosphor-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        'phosphor-green': '0 0 15px rgba(74, 246, 38, 0.35)',
        'hazard-glow': '0 0 20px rgba(255, 42, 42, 0.45)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 3s linear infinite',
        'orb-a': 'orb-a 26s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate',
        'orb-b': 'orb-b 32s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate',
        'orb-c': 'orb-c 38s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate',
        marquee: 'marquee 48s linear infinite',
        shimmer: 'shimmer 1.6s cubic-bezier(0.32, 0.72, 0, 1) infinite',
        'spin-slow': 'spin 1.1s cubic-bezier(0.5, 0.15, 0.5, 0.85) infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'orb-a': {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '100%': { transform: 'translate3d(12vw, 8vh, 0) scale(1.15)' },
        },
        'orb-b': {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1.1)' },
          '100%': { transform: 'translate3d(-14vw, 10vh, 0) scale(0.95)' },
        },
        'orb-c': {
          '0%': { transform: 'translate3d(0, 0, 0) scale(0.9)' },
          '100%': { transform: 'translate3d(8vw, -12vh, 0) scale(1.1)' },
        },
        marquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
        shimmer: {
          '0%': { transform: 'translate3d(-100%, 0, 0)' },
          '100%': { transform: 'translate3d(100%, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
};
