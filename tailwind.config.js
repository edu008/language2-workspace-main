const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./styles/**/*.css",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: ["class"],
  safelist: [
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-3",
    "grid-cols-4",
    "sm:grid-cols-1",
    "sm:grid-cols-2",
    "lg:grid-cols-3",
    "lg:grid-cols-4",
    // Dynamically generated classes that should not be purged
    /^grid-cols-/,
    /^sm:grid-cols-/,
    /^lg:grid-cols-/,
    /^text-/,
    /^bg-/,
    /^from-/,
    /^to-/,
    /^border-/,
    /^h-/,
    /^w-/,
    /^p-/,
    /^m-/,
    /^rounded-/,
    // Animation classes
    /^animate-/,
    // Opacity modifiers
    /^bg-.*\/\d+$/,
    /^border-.*\/\d+$/,
    /^text-.*\/\d+$/,
    // State modifiers
    /^checked:/,
    /^focus:/,
    /^hover:/,
    /^disabled:/,
    // Z-index classes
    /^z-/,
    // Gap classes
    /^gap-/,
    // Flex classes
    /^flex-/,
    // Transition classes
    /^transition-/,
    /^duration-/,
    /^ease-/,
    // Transform classes
    /^transform-/,
    // Shadow classes
    /^shadow-/,
    // Additional utility classes
    /^justify-/,
    /^items-/,
    /^space-/,
    /^overflow-/,
    /^whitespace-/,
    /^tracking-/,
    /^font-/,
    /^max-/,
    /^min-/,
    /^opacity-/,
    /^outline-/,
    /^ring-/,
    /^scale-/,
    /^rotate-/,
    /^translate-/,
    /^skew-/,
    /^cursor-/,
    /^select-/,
    /^appearance-/
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
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
          500: "#1E90FF",
          600: "#1A7FFF",
        },
        deutsch: {
          blue: "#007AFF",
          red: "#FF3B30",
          background: "#FFFFFF",
          gray: "#F2F2F7",
          text: "#1D1D1F",
        },
        wg: {
          blue: {
            50: "#f0f7ff",
            100: "#e0f1ff",
            200: "#c0e3ff",
            300: "#8fcdff",
            400: "#5aacff",
            500: "#3183ff",
            600: "#1a65ff",
            700: "#0f4aec",
            800: "#0f3cbb",
            900: "#123494",
          },
          neutral: {
            50: "#f8f9fa",
            100: "#f1f3f5",
            200: "#e9ecef",
            300: "#dee2e6",
            400: "#ced4da",
            500: "#adb5bd",
            600: "#868e96",
            700: "#495057",
            800: "#343a40",
            900: "#212529",
          },
        },
        germanic: {
          50: "#f7f7f9",
          100: "#e9eaf2",
          200: "#d4d6e5",
          300: "#b3b7d0",
          400: "#8c91b6",
          500: "#5A5E83", // Dunklere Farbe für besseren Kontrast (war: #6e739e)
          600: "#484C6E", // Dunklere Farbe für besseren Kontrast (war: #585c82)
          700: "#3A3D59", // Dunklere Farbe für besseren Kontrast (war: #484b6a)
          800: "#3e4159",
          900: "#363849",
          950: "#25262f",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["SF Pro Display", "Inter", "system-ui", "sans-serif"],
        serif: ["SF Pro Text", "Georgia", "serif"],
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
        "button-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "wave": {
          "0%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(-15px)" },
          "50%": { transform: "translateY(0)" },
          "75%": { transform: "translateY(15px)" },
          "100%": { transform: "translateY(0)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "float-in": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "fade-up": { // Neue Animation für Fade von unten nach oben
          "0%": { opacity: "0", transform: "translateY(50px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "grow-x": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "draw": {
          "0%": { strokeDasharray: "1 1000", strokeDashoffset: "1000", opacity: "0" },
          "100%": { strokeDasharray: "1000 1000", strokeDashoffset: "0", opacity: "1" },
        },
        "pulse-glow": {
          "0%": { boxShadow: "0px 0px 0px rgba(59, 130, 246, 0)" },
          "50%": { boxShadow: "0px 0px 30px rgba(59, 130, 246, 0.5)" },
          "100%": { boxShadow: "0px 0px 0px rgba(59, 130, 246, 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "flip-in": "flip-in 0.4s ease-out",
        "flip-out": "flip-out 0.4s ease-out",
        "card-hover": "card-hover 0.3s ease-out forwards",
        "button-pulse": "button-pulse 2s infinite",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "wave": "wave 2s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        "float-in": "float-in 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "slide-in": "slide-in 0.6s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out forwards", // Neue Animation hinzugefügt
        "grow-x": "grow-x 0.5s ease-out forwards",
        "draw": "draw 1s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".header-button": {
          padding: "0.75rem 1.5rem",
          "font-size": "1.25rem",
          "font-weight": "600",
        },
      });
    },
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-animate"),
  ],
});
