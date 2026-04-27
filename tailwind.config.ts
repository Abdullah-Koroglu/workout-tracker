import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        // Design system tokens from athlete_training_calendar
        "surface": "#f7f9fb",
        "on-surface": "#191c1e",
        "surface-bright": "#f7f9fb",
        "surface-dim": "#d8dadc",
        "surface-variant": "#e0e3e5",
        "on-surface-variant": "#584237",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "primary-container": "#f97316",
        "on-primary": "#ffffff",
        "on-primary-container": "#582200",
        "primary-fixed": "#ffdbca",
        "primary-fixed-dim": "#ffb690",
        "on-primary-fixed": "#341100",
        "on-primary-fixed-variant": "#783200",
        "inverse-primary": "#ffb690",
        "tertiary": "#0053db",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#7296ff",
        "on-tertiary-container": "#002c7c",
        "tertiary-fixed": "#dbe1ff",
        "tertiary-fixed-dim": "#b4c5ff",
        "on-tertiary-fixed": "#00174b",
        "on-tertiary-fixed-variant": "#003ea8",
        "secondary-container": "#b6d0ff",
        "on-secondary-container": "#3f5882",
        "secondary-fixed": "#d6e3ff",
        "secondary-fixed-dim": "#adc7f7",
        "on-secondary-fixed": "#001b3c",
        "on-secondary-fixed-variant": "#2d476f",
        "outline": "#8c7164",
        "outline-variant": "#e0c0b1",
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "surface-tint": "#9d4300",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  },
  plugins: []
};

export default config;
