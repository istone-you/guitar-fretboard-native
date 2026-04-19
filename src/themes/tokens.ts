// Unified design tokens — single source of truth for colors, radius, typography
// All components should import from here instead of hard-coding values.

const lightPalette = {
  bg: "#f9f9f9",
  surface: "#ffffff",
  surface2: "#f4f4f5",
  text: "#1c1917",
  textSubtle: "#78716c",
  border: "rgba(0,0,0,0.09)",
  borderStrong: "#d6d3d1",
  tabBar: "#fafafa",
  tabBorder: "#e5e5ea",
} as const;

const darkPalette = {
  bg: "#0a0a0a",
  surface: "#1a1a1a",
  surface2: "#242424",
  text: "#f9fafb",
  textSubtle: "#9ca3af",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "#4b5563",
  tabBar: "#111111",
  tabBorder: "rgba(255,255,255,0.08)",
} as const;

export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  textSubtle: string;
  border: string;
  borderStrong: string;
  tabBar: string;
  tabBorder: string;
};

export function getColors(isDark: boolean): ThemeColors {
  return isDark ? darkPalette : lightPalette;
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 17,
  display: 34,
} as const;
