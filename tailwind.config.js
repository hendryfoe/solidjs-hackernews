/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.tsx'],
  theme: {
    extend: {
      backgroundColor: {
        'hackernews-title': '#ff6600',
        'hackernews-body': '#f6f6ef'
      }
    }
  },
  plugins: []
};
