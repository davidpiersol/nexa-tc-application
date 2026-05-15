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
    "./lib/help/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          "navy-deep": "#0B1220",
          navy: "#0B1220",
          "navy-mid": "#162235",
          steel: "#41566B",
          sky: "#A8B3C2",
          gold: "#D4AF37",
          "gold-deep": "#B97811",
          "gold-light": "#F2C979",
          "gold-pale": "#FFF6E8",
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
          DEFAULT: "#F3EEE7",
          50: "#FBF7F1",
          100: "#F3EEE7",
          300: "#D7D0C6",
          600: "#5E625F",
          900: "#122033",
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
        "brand-md": "12px",
        "brand-lg": "16px",
        "brand-full": "9999px",
      },
      boxShadow: {
        "brand-sm": "0 1px 3px rgba(11, 18, 32, 0.08)",
        "brand-md": "0 8px 18px rgba(11, 18, 32, 0.10)",
        "brand-lg": "0 24px 60px rgba(11, 18, 32, 0.10)",
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
