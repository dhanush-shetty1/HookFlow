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
        border: '#27272a',
        input: '#27272a',
        ring: '#d4d4d8',
        background: '#09090b',
        foreground: '#fafafa',
        primary: { DEFAULT: '#fafafa', foreground: '#09090b' },
        secondary: { DEFAULT: '#27272a', foreground: '#fafafa' },
        muted: { DEFAULT: '#18181b', foreground: '#a1a1aa' },
        accent: { DEFAULT: '#27272a', foreground: '#fafafa' },
        card: { DEFAULT: '#09090b', foreground: '#fafafa' },
        popover: { DEFAULT: '#09090b', foreground: '#fafafa' },
        destructive: { DEFAULT: '#7f1d1d', foreground: '#fecaca' },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
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
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(52, 211, 153, 0.4)' },
          '50%': { 'box-shadow': '0 0 0 6px rgba(52, 211, 153, 0)' },
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
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
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
