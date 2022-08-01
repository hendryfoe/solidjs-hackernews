/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.tsx'],
  theme: {
    extend: {
      fontSize: {
        lg: ['1.125rem', { lineHeight: '1.5rem' }] // changed from 1.75rem
      },
      backgroundColor: {
        'hackernews-title': '#ff6600',
        'hackernews-body': '#f6f6ef'
      }
    }
  },
  plugins: []
};
