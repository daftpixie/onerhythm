import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "var(--color-deep-void)",
          midnight: "var(--color-midnight)",
        },
        "deep-void": "var(--color-deep-void)",
        cosmos: {
          DEFAULT: "var(--color-cosmos)",
          nebula: "var(--color-nebula)",
        },
        pulse: {
          DEFAULT: "var(--color-pulse)",
          glow: "var(--color-pulse-glow)",
          dark: "var(--color-pulse-dark)",
        },
        signal: {
          DEFAULT: "var(--color-signal)",
          soft: "var(--color-signal-soft)",
          dim: "var(--color-signal-dim)",
        },
        aurora: {
          DEFAULT: "var(--color-aurora)",
          glow: "var(--color-aurora-glow)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        ui: {
          border: "var(--color-border)",
          success: "var(--color-success)",
          warning: "var(--color-warning)",
        },
        warning: "var(--color-warning)",
        success: "var(--color-success)",
        token: "var(--color-border)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        pulse: "var(--glow-pulse)",
        signal: "var(--glow-signal)",
        aurora: "var(--glow-aurora)",
        subtle: "var(--glow-subtle)",
        surface: "var(--shadow-surface)",
        panel: "var(--shadow-panel)",
      },
      backgroundImage: {
        heartbeat: "var(--gradient-heartbeat)",
        signal: "var(--gradient-signal)",
        void: "var(--gradient-void)",
        aurora: "var(--gradient-aurora)",
      },
      transitionDuration: {
        micro: "var(--duration-micro)",
        normal: "var(--duration-normal)",
        reveal: "var(--duration-reveal)",
      },
      transitionTimingFunction: {
        heartbeat: "var(--ease-heartbeat)",
        reveal: "var(--ease-reveal)",
      },
    },
  },
  plugins: [],
};

export default config;
