/** @type {import('tailwindcss').Config} */

const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./styles/**/*.css",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        blue: {
          500: '#1E90FF',
          600: '#1A7FFF',
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "flip-in": {
          "0%": { transform: "rotateY(180deg)", opacity: "0" },
          "100%": { transform: "rotateY(0)", opacity: "1" },
        },
        "flip-out": {
          "0%": { transform: "rotateY(0)", opacity: "1" },
          "100%": { transform: "rotateY(180deg)", opacity: "0" },
        },
        "card-hover": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "flip-in": "flip-in 0.4s ease-out",
        "flip-out": "flip-out 0.4s ease-out",
        "card-hover": "card-hover 0.3s ease-out forwards",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".header-button": {
          "padding": "0.75rem 1.5rem",
          "font-size": "1.25rem",
          "font-weight": "600",
        },
      });
    },
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-animate"),
  ],
});
