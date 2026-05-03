import type { Config } from "tailwindcss";

/**
 * Nexa design tokens → Tailwind + shadcn/ui semantic variables.
 * Source: `nexa_build_guide.md` Step 2 (“00 — Design Tokens” naming).
 * Reconcile with live Figma styles via MCP when you share the file URL (same hex/names).
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          "navy-deep": "#0D1B2A",
          navy: "#1A2E4A",
          "navy-mid": "#1E3A5F",
          steel: "#2D5F8A",
          sky: "#4A82B4",
          gold: "#C9922A",
          "gold-light": "#E8B84B",
          "gold-pale": "#F5E6C0",
          brown: "#6B4226",
          "brown-warm": "#8B5E3C",
          "brown-pale": "#F0E6D8",
        },
        nexa: {
          navy: "#0B1F3A",
          blue: "#1F6FEB",
          lightBlue: "#E8F0FE",
          slate: "#4B5563",
          gray: "#9CA3AF",
          offWhite: "#F9FAFB",
          teal: "#14B8A6",
        },
        neutral: {
          DEFAULT: "#EDE9E3",
          50: "#F7F5F2",
          100: "#EDE9E3",
          300: "#C4BDB5",
          600: "#6B6560",
          900: "#1C1917",
        },
        status: {
          success: "#2D6A4F",
          warning: "#92400E",
          danger: "#991B1B",
        },
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
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        prose: ["var(--font-prose)", "Georgia", "serif"],
      },
      fontSize: {
        "heading-xl": [
          "36px",
          { lineHeight: "1.1", fontWeight: "700", letterSpacing: "0" },
        ],
        "heading-lg": [
          "28px",
          { lineHeight: "1.2", fontWeight: "700", letterSpacing: "0" },
        ],
        "heading-md": [
          "22px",
          { lineHeight: "1.3", fontWeight: "600", letterSpacing: "0" },
        ],
        "ui-label": [
          "13px",
          {
            lineHeight: "1.25",
            fontWeight: "600",
            letterSpacing: "0.08em",
          },
        ],
        "ui-body": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "prose-body": ["17px", { lineHeight: "1.6", fontWeight: "400" }],
      },
      spacing: {
        "gds-1": "4px",
        "gds-2": "8px",
        "gds-3": "12px",
        "gds-4": "16px",
        "gds-5": "20px",
        "gds-6": "24px",
        "gds-7": "32px",
        "gds-8": "40px",
        "gds-9": "48px",
        "gds-10": "64px",
        "gds-11": "80px",
        "gds-12": "96px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "brand-sm": "4px",
        "brand-md": "8px",
        "brand-lg": "12px",
        "brand-full": "9999px",
      },
      boxShadow: {
        "brand-sm": "0 1px 3px rgba(13, 27, 42, 0.08)",
        "brand-md": "0 4px 8px rgba(13, 27, 42, 0.12)",
        "brand-lg": "0 12px 24px rgba(13, 27, 42, 0.16)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
