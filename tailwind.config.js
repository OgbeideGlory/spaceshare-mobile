// The same colours as the web app (../tc8-capstone/src/index.css), so classes like
// bg-primary and text-accent look the same on the phone.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './src/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  // Light mode only for now (the web app has no dark mode). Dark styles only apply with a 'dark' class.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Orange: main buttons, highlighted words, prices
        primary: { DEFAULT: '#e2692c', dark: '#c2541c', light: '#fdebdd' },
        // Dark teal: "Find Spaces" button, host banner overlay
        accent: { DEFAULT: '#1f4d4a', dark: '#163a38' },
        // Soft section backgrounds
        cream: '#fbf7f2',
        blush: '#fcf4f2',
        mint: '#f3fbf8',
        lavender: '#f4f2ff',
      },
    },
  },
  plugins: [],
}
