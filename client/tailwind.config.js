/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Custom CSS variables
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
          hover: 'var(--secondary-hover)',
          light: 'var(--secondary-light)',
          dark: 'var(--secondary-dark)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
          dark: 'var(--accent-dark)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
          hover: 'var(--destructive-hover)',
          light: 'var(--destructive-light)',
          dark: 'var(--destructive-dark)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          hover: 'var(--success-hover)',
          light: 'var(--success-light)',
          dark: 'var(--success-dark)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
          hover: 'var(--warning-hover)',
          light: 'var(--warning-light)',
          dark: 'var(--warning-dark)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
          hover: 'var(--info-hover)',
          light: 'var(--info-light)',
          dark: 'var(--info-dark)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
          hover: 'var(--muted-hover)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
          hover: 'var(--card-hover)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
          hover: 'var(--popover-hover)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        // WorkWise brand colors
        workwise: {
          blue: 'var(--workwise-blue)',
          'blue-light': 'var(--workwise-blue-light)',
          'blue-dark': 'var(--workwise-blue-dark)',
          yellow: 'var(--workwise-yellow)',
          'yellow-light': 'var(--workwise-yellow-light)',
          'yellow-dark': 'var(--workwise-yellow-dark)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'shadow-sm': 'var(--shadow-sm)',
        'shadow': 'var(--shadow)',
        'shadow-md': 'var(--shadow-md)',
        'shadow-lg': 'var(--shadow-lg)',
        'shadow-xl': 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
}