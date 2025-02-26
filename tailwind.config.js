/** @type {import('tailwindcss').Config} */

const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./components/**/*.{js,jsx,ts,tsx}", // Scannt alle Dateien in components/ mit .js, .jsx, .ts, .tsx
    "./pages/**/*.{js,jsx,ts,tsx}",      // Scannt alle Dateien in pages/ mit .js, .jsx, .ts, .tsx
  ],
  theme: {
    extend: {
      height: {
        '14': '3.5rem', // Für h-14 im Header
      },
      zIndex: {
        '100': '100', // Für z-100 im Header
        '200': '200', // Für z-200, falls nötig für höhere Priorität
      },
      fontSize: {
        'xl': '1.25rem', // Für text-xl im Header
        'sm': '0.875rem', // Für text-sm im Header
      },
      padding: {
        '4': '1rem',   // Für px-4, py-2, etc.
        '6': '1.5rem', // Für px-6, py-3, etc.
        '8': '2rem',   // Für sm:px-8, lg:px-12, etc.
      },
      spacing: {
        '3': '0.75rem', // Für space-x-3
        '4': '1rem',    // Für space-x-4
      },
      borderColor: {
        '200': '#e5e7eb', // Für border-gray-200 in der zusätzlichen Linie
      },
      backgroundOpacity: {
        '80': '0.8', // Für bg-white/80 im Header
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio') // Für aspect-ratio-Unterstützung  
    ],
});