import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        featured: "hsl(var(--featured))",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // Instagram-Handy im Startseiten-Kopf: von unten einfliegen …
        "phone-rise": {
          "0%": { transform: "translateY(115%)", opacity: "0" },
          "60%": { opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        // „Ton einschalten“-Knopf: sanfter Puls-Ring, damit man ihn sieht
        "sound-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,255,255,0.75)" },
          "70%": { boxShadow: "0 0 0 12px rgba(255,255,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,255,255,0)" },
        },
        // … und danach kurz schütteln
        "phone-shake": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "12%": { transform: "rotate(-5deg)" },
          "26%": { transform: "rotate(4.5deg)" },
          "40%": { transform: "rotate(-3.5deg)" },
          "54%": { transform: "rotate(2.5deg)" },
          "68%": { transform: "rotate(-1.5deg)" },
          "82%": { transform: "rotate(0.75deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "phone-rise": "phone-rise 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
        "phone-shake": "phone-shake 0.8s ease-in-out 1.35s both",
        "sound-pulse": "sound-pulse 1.8s ease-out 2.3s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
