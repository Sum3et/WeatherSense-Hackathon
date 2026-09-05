/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WeatherSense design system
        // WeatherSense Cream & Light Bluish Atmospheric Palette
        navy: {
          950: '#faf6ee', // Warm cream base
          900: '#f3f8fd', // Soft light bluish cream
          800: '#e5f0fc', // Light blue atmospheric wash
          700: '#d0e5fb', // Sky tint
          600: '#b9dbf8', // Soft sky blue border
        },
        cream: {
          50:  '#fefdfb',
          100: '#fdfbf7',
          200: '#faf6ef',
          300: '#f5efe4',
          400: '#eee5d4',
        },
        sky: {
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        slate: {
          750: '#e2ebf6',
          850: '#edf4fc',
        },
        status: {
          pending:  '#d97706',
          verified: '#059669',
          flagged:  '#ea580c',
          spam:     '#dc2626',
          rejected: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "linear-gradient(135deg, rgba(224,242,254,0.7) 0%, rgba(254,249,240,0.85) 45%, rgba(219,234,254,0.75) 80%, rgba(253,246,233,0.95) 100%)",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow-blue': '0 0 20px rgba(14, 165, 233, 0.3)',
      },
    },
  },
  plugins: [],
}
