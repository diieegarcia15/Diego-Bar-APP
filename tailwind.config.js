/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fondo oscuro premium
        dark: {
          900: '#0a0a14',
          800: '#0f0f23',
          700: '#1a1a2e',
          600: '#16213e',
          500: '#1e293b',
          400: '#2d3748',
        },
        // Verde acento restaurante
        accent: {
          DEFAULT: '#2ecc71',
          light: '#58d68d',
          dark: '#27ae60',
          deeper: '#1e8449',
        },
        // Estado de pedidos
        status: {
          received: '#2ecc71',
          preparing: '#f39c12',
          ready: '#3498db',
          delivered: '#95a5a6',
          danger: '#e74c3c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-green': 'pulseGreen 2s infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'timer-pulse': 'timerPulse 1s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(46, 204, 113, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(46, 204, 113, 0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        timerPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        'glow-green': '0 0 20px rgba(46, 204, 113, 0.3)',
      },
    },
  },
  plugins: [],
};
