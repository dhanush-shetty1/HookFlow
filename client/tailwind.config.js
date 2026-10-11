/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        bg2: '#0a0a0a',
        panel: '#0c0c0c',
        panel2: '#141414',
        fg: '#e4e4e7',
        heading: '#ffffff',
        muted: '#71717a',
        border: '#222222',
        accent: '#ffffff',
        accent2: '#a1a1aa',
        green: '#4ade80',
        gold: '#fbbf24',
        red: '#f87171',
        input: '#121212',
        ring: '#ffffff',
        background: '#000000',
        foreground: '#e4e4e7',
        primary: { DEFAULT: '#ffffff', foreground: '#000000' },
        secondary: { DEFAULT: '#121212', foreground: '#e4e4e7' },
        card: { DEFAULT: '#0a0a0a', foreground: '#e4e4e7' },
        popover: { DEFAULT: '#0c0c0c', foreground: '#e4e4e7' },
        destructive: { DEFAULT: '#f87171', foreground: '#ffffff' },
      },
      fontFamily: {
        mono: ["'Fira Code'", 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ["'Fira Code'", 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      animation: {
        'spotlight': 'spotlight 2s ease .75s 1 forwards',
        'border-beam': 'border-beam var(--duration) infinite linear',
        'shimmer-slide': 'shimmer-slide 2.5s infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'gradient': 'gradient-shift 4s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        spotlight: {
          '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%,-40%) scale(1)' },
        },
        'border-beam': {
          '100%': { 'offset-distance': '100%' },
        },
        'shimmer-slide': {
          'to': { transform: 'translateX(100%)' },
        },
        'glow-pulse': {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(74, 222, 128, 0.4)' },
          '50%': { 'box-shadow': '0 0 0 6px rgba(74, 222, 128, 0)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '33%': { transform: 'translateY(-20px) translateX(10px)' },
          '66%': { transform: 'translateY(10px) translateX(-10px)' },
        },
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
    },
  },
  plugins: [],
}
