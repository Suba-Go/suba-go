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
        ring: '#ffd600', // Amarillo
        background: '#f8fafc', // Soft white
        foreground: '#16191b', // Negro
        primary: {
          DEFAULT: '#ffcc00', // Amarillo
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
        dark: '#16191b', // Negro
        'soft-white': '#f8fafc', // Soft white
        yellow: '#ffcc00', // Amarillo
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
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
