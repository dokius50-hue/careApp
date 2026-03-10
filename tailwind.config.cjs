/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }]
      },
      colors: {
        auth: {
          teal: '#0d9488',
          tealDark: '#0f766e',
          violet: '#7c3aed',
          violetDark: '#6d28d9',
          accent: '#f59e0b'
        }
      },
      fontFamily: {
        auth: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      keyframes: {
        'auth-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'auth-fade-up': 'auth-fade-up 0.5s ease-out forwards'
      }
    }
  },
  plugins: []
};

