export const theme = {
  colors: {
    // Deep Space / Cyber-Luxury Base
    background: "#06080f",
    backgroundSecondary: "#0b0f1a",
    backgroundCard: "rgba(15, 23, 42, 0.65)",
    backgroundCardHover: "rgba(23, 37, 84, 0.55)",

    // Holographic Cyber Accents
    neonCyan: "#00f0ff",
    neonCyanGlow: "rgba(0, 240, 255, 0.35)",
    cyberPurple: "#8b5cf6",
    cyberPurpleGlow: "rgba(139, 92, 246, 0.35)",
    cyberViolet: "#7000ff",
    emeraldActive: "#10b981",
    emeraldGlow: "rgba(16, 185, 129, 0.35)",

    // Status Colors
    danger: "#ef4444",
    dangerGlow: "rgba(239, 68, 68, 0.35)",
    warning: "#f59e0b",
    warningGlow: "rgba(245, 158, 11, 0.35)",

    // Typography
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    textHighlight: "#38bdf8",

    // Borders & Glass
    borderSubtle: "rgba(148, 163, 184, 0.12)",
    borderNeon: "rgba(0, 240, 255, 0.4)",
    borderPurple: "rgba(139, 92, 246, 0.4)",
    glassSurface: "rgba(11, 15, 26, 0.75)",
  },

  fonts: {
    sans: "System",
    mono: "monospace",
  },

  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  shadows: {
    cyanGlow: {
      shadowColor: "#00f0ff",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 18,
      elevation: 8,
    },
    purpleGlow: {
      shadowColor: "#8b5cf6",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 18,
      elevation: 8,
    },
    dangerGlow: {
      shadowColor: "#ef4444",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 14,
      elevation: 6,
    },
  },
} as const;

export type Theme = typeof theme;

