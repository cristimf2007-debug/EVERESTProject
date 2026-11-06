/** @type {import('tailwindcss').Config} */
module.exports = {
    // `overline` is a Tailwind utility; without this an app's own eyebrow-label class draws a line above the text.
    blocklist: ["overline"],
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'var(--void)',
        foreground: 'var(--text)',
        card: {
          DEFAULT: 'var(--obsidian)',
          foreground: 'var(--text)'
        },
        popover: {
          DEFAULT: 'var(--obsidian-2)',
          foreground: 'var(--text)'
        },
        primary: {
          DEFAULT: 'var(--text)',
          foreground: 'var(--void)'
        },
        secondary: {
          DEFAULT: 'var(--steel)',
          foreground: 'var(--text)'
        },
        muted: {
          DEFAULT: 'var(--obsidian-2)',
          foreground: 'var(--text-2)'
        },
        accent: {
          DEFAULT: 'var(--steel)',
          foreground: 'var(--text)'
        },
        destructive: {
          DEFAULT: 'var(--live)',
          foreground: 'var(--void)'
        },
        border: 'var(--edge)',
        input: 'var(--edge-hi)',
        ring: 'var(--text)',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};