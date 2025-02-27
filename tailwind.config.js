/** @type {import('tailwindcss').Config} */

const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./components/**/*.{js,jsx,ts,tsx}", // Unverändert
    "./pages/**/*.{js,jsx,ts,tsx}",      // Unverändert
    "./styles/**/*.css",                 // Geändert von ./styles/**/*.{css} zu ./styles/**/*.css
  ],
  darkMode: ["class"],
  safelist: [
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'sm:grid-cols-1',
    'sm:grid-cols-2',
    'lg:grid-cols-3',
  ], // Zwangsgenerierung dieser Klassen, um sicherzustellen, dass sie immer enthalten sind
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "640px",  // Kleinere Bildschirme: 2 Spalten
        md: "768px",
        lg: "1024px", // Größere Bildschirme: 3 Spalten
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      height: {
        "14": "3.5rem",
      },
      zIndex: {
        "100": "100",
        "200": "200",
      },
      fontSize: {
        "xl": "1.25rem",
        "sm": "0.875rem",
      },
      padding: {
        "4": "1rem",
        "6": "1.5rem",
        "8": "2rem",
      },
      spacing: {
        "3": "0.75rem",
        "4": "1rem",
      },
      borderColor: {
        "200": "#e5e7eb",
      },
      backgroundOpacity: {
        "80": "0.8",
      },
      colors: {
        rose: {
          100: "#ffe4e6",
        },
        red: {
          600: "#dc2626",
        },
        black: "#000000",
        destructive: "#ff0000",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        blue: { // Neue benutzerdefinierte blaue Farbe hinzufügen
          500: '#1E90FF', // Helles Blau (königliches Blau)
          600: '#1A7FFF', // Dunkleres Blau für Hover
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "card-hover": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "card-hover": "card-hover 0.3s ease-out forwards",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".header-button": {
          "padding": "0.75rem 1.5rem", // py-3 px-6
          "font-size": "1.25rem", // text-xl
          "font-weight": "600", // font-semibold
        },
      });
    },
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-animate"), // Für Animationen wie animate-card-hover
  ],
});