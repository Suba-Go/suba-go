/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './public/index.html',
    './src/**/*.{ts,tsx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Suba&Go custom palette and UI colors, no CSS variables
        border: '#e5e7eb', // gray-200
        input: '#f1f5f9', // slate-100
        ring: '#ECC218', // Amarillo
        background: '#f8fafc', // Soft white
        foreground: '#16191b', // Negro
        primary: {
          DEFAULT: '#ECC218', // Amarillo
          background: '#f8fafc',
          foreground: '#16191b', // Negro para texto sobre amarillo
        },
        secondary: {
          DEFAULT: '#f1f5f9', // slate-100
          background: '#f8fafc',
          foreground: '#16191b', // Negro
        },
        destructive: {
          DEFAULT: '#ef4444', // red-500
          background: '#f8fafc',
          foreground: '#16191b', // blanco
        },
        popover: {
          DEFAULT: '#fff', // blanco
          background: '#f8fafc',
          foreground: '#16191b', // Negro
        },
        card: {
          DEFAULT: '#f8fafc', // gray-200
          background: '#f8fafc',
          foreground: '#16191b', // Negro
        },
        success: {
          DEFAULT: '#008000', // Verde
          background: '#fff',
          foreground: '#16191b', // dark
        },
        // Colores personalizados de Suba&Go
        dark: {
          DEFAULT: '#16191b', // Negro
          secondary: '#1a1a24', // Panel oscuro
          panel: '#10101C', // Panel terminal
        },
        'soft-white': '#f8fafc', // Soft white
        yellow: '#ECC218', // Amarillo
        muted: '#555555', // Texto muted
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'grid-scroll': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '64px 64px' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.08)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glitch: {
          '0%, 94%, 100%': { transform: 'none', opacity: '1' },
          '95%': { transform: 'translateX(-2px) skewX(-1deg)', opacity: '0.85' },
          '96%': { transform: 'translateX(2px) skewX(1deg)', opacity: '0.9' },
          '97%': { transform: 'none', opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'grid-scroll': 'grid-scroll 30s linear infinite',
        'glow-pulse': 'glow-pulse 5s ease-in-out infinite',
        blink: 'blink 1.4s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        glitch: 'glitch 7s infinite',
        ticker: 'ticker 28s linear infinite',
        'fade-up': 'fade-up 0.3s ease both',
        'fade-in': 'fade-in 0.4s ease both',
      },
      zIndex: {
        'over-everything': '9999',
        navbar: '900',
        modal: '1000',
        modal2: '1001',
        toast: '2000',
        dropdown: '1500',
      },
    },
  },
  plugins: [],
};
