import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Poppins", ...fontFamily.sans],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#63B3ED",
        background: "#F7FAFC",
        foreground: "#1A202C",
        primary: {
          DEFAULT: "#63B3ED",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#E2E8F0",
          foreground: "#1A202C",
        },
        destructive: {
          DEFAULT: "#E53E3E",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#F7FAFC",
          foreground: "#718096",
        },
        accent: {
          DEFAULT: "#ECC94B",
          foreground: "#1A202C",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1A202C",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1A202C",
        },
        chart: {
          1: "#63B3ED", // Primary blue
          2: "#ECC94B", // Warm Yellow
          3: "#48BB78", // Green
          4: "#ED64A6", // Pink
          5: "#4C51BF", // Deep Blue
        },
        sidebar: {
          DEFAULT: "#1A202C",
          foreground: "#F7FAFC",
          primary: "#63B3ED",
          "primary-foreground": "#1A202C",
          accent: "#2D3748",
          "accent-foreground": "#F7FAFC",
          border: "#2D3748",
          ring: "#A0AEC0",
        },
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
        "slide-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-to-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "ping": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-from-left": "slide-from-left 0.3s ease-out",
        "slide-to-left": "slide-to-left 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-in",
        "fade-out": "fade-out 0.3s ease-out",
        "spin": "spin 1.5s linear infinite",
        "ping": "ping 1.5s ease-in-out infinite",
      },
      screens: {
        xs: "480px",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            a: {
              color: 'hsl(var(--primary))',
              '&:hover': {
                color: 'hsl(var(--primary))',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")({
      strategy: 'class', // only generate classes when using the 'form-input' class
    }),
  ],
} satisfies Config;
