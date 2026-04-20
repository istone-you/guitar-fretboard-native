import type { LayerConfig } from "../types";

// ── Theme (Light / Dark) ──────────────────────────────────────────────────────

const lightPalette = {
  bg: "#f9f9f9",
  pageBg: "#ffffff",
  surface: "#ffffff",
  surface2: "#f4f4f5",
  cardBg: "#ffffff",
  sheetBg: "#fafaf9",
  deepBg: "#fafaf9",
  text: "#1c1917",
  textStrong: "#1c1917",
  textSubtle: "#78716c",
  textMuted: "#a8a29e",
  textDim: "#44403c",
  textDanger: "#ef4444",
  border: "rgba(0,0,0,0.09)",
  borderStrong: "#d6d3d1",
  border2: "#e7e5e4",
  fillIdle: "#f5f5f4",
  progressTrack: "#e5e7eb",
  tabBar: "#fafafa",
  tabBorder: "#e5e5ea",

  dragHandle: "#c4c4c6",
  primaryBtn: "#1c1917",
  primaryBtnText: "#ffffff",
  iconSubtle: "#6b7280",
  diagramLine: "#d6d3d1",
  diagramNut: "#44403c",
  sliderTrackFilled: "rgba(0,0,0,0.42)",
  sliderTrackEmpty: "rgba(0,0,0,0.13)",
  fretNut: "#78716c",
  sheetBorder: "#e7e5e4",
} as const;

const darkPalette = {
  bg: "#0a0a0a",
  pageBg: "#000000",
  surface: "#1a1a1a",
  surface2: "#242424",
  cardBg: "#1c1c1e",
  sheetBg: "#1f2937",
  deepBg: "#111827",
  text: "#f9fafb",
  textStrong: "#e5e7eb",
  textSubtle: "#9ca3af",
  textMuted: "#6b7280",
  textDim: "#d1d5db",
  textDanger: "#f87171",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "#4b5563",
  border2: "#374151",
  fillIdle: "#374151",
  progressTrack: "#3a3a3c",
  tabBar: "#111111",
  tabBorder: "rgba(255,255,255,0.08)",

  dragHandle: "#4b5563",
  primaryBtn: "#e5e7eb",
  primaryBtnText: "#1c1917",
  iconSubtle: "#9ca3af",
  diagramLine: "#374151",
  diagramNut: "#9ca3af",
  sliderTrackFilled: "rgba(255,255,255,0.55)",
  sliderTrackEmpty: "rgba(255,255,255,0.18)",
  fretNut: "#d1d5db",
  sheetBorder: "rgba(255,255,255,0.08)",
} as const;

export type ThemeColors = {
  bg: string;
  pageBg: string;
  surface: string;
  surface2: string;
  cardBg: string;
  sheetBg: string;
  deepBg: string;
  text: string;
  textStrong: string;
  textSubtle: string;
  textMuted: string;
  textDim: string;
  textDanger: string;
  border: string;
  borderStrong: string;
  border2: string;
  fillIdle: string;
  progressTrack: string;
  tabBar: string;
  tabBorder: string;

  dragHandle: string;
  primaryBtn: string;
  primaryBtnText: string;
  iconSubtle: string;
  diagramLine: string;
  diagramNut: string;
  sliderTrackFilled: string;
  sliderTrackEmpty: string;
  fretNut: string;
  sheetBorder: string;
};

export function getColors(isDark: boolean): ThemeColors {
  return isDark ? darkPalette : lightPalette;
}

// ── Spacing / Typography ──────────────────────────────────────────────────────

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

// ── Semantic colors (theme-independent) ──────────────────────────────────────

export const WHITE = "#ffffff";
export const BLACK = "#000000";

export const SEMANTIC_COLORS = {
  success: "#16a34a",
  error: "#ef4444",
  destructive: "#ff3b30",
};

// ── Quiz mode accent colors ───────────────────────────────────────────────────

export const QUIZ_MODE_COLORS = {
  note: "#007AFF",
  degree: "#5856D6",
  chord: "#FF9500",
  scale: "#34C759",
  diatonic: "#FF3B30",
};

// ── Layer colors ──────────────────────────────────────────────────────────────

const DEFAULT_LAYER_COLORS = ["#ff69b6", "#40e0d0", "#ffd700", "#a78bfa"];

export const COLOR_PRESETS = [
  "#ff4d4d",
  "#ff8c00",
  "#ffd700",
  "#84cc16",
  "#10b981",
  "#40e0d0",
  "#00bfff",
  "#0ea5e9",
  "#a78bfa",
  "#ff69b6",
];

export function pickNextLayerColor(currentLayers: LayerConfig[]): string {
  const usedColors = new Set(currentLayers.map((l) => l.color));
  return (
    DEFAULT_LAYER_COLORS.find((c) => !usedColors.has(c)) ??
    DEFAULT_LAYER_COLORS[currentLayers.length % DEFAULT_LAYER_COLORS.length]
  );
}

// ── Quiz accent colors ────────────────────────────────────────────────────────

export const QUIZ_ACCENT_COLORS = {
  chordDiatonic: "#40e0d0",
  other: "#ff69b6",
};

// ── Stats rate color endpoints ────────────────────────────────────────────────

export const STATS_RATE_COLORS = {
  worst: { r: 239, g: 68, b: 68 },
  best: { r: 34, g: 197, b: 94 },
};

// ── Toggle colors ─────────────────────────────────────────────────────────────

export const TOGGLE_COLORS = {
  on: "#34C759",
  offDark: "#3A3A3C",
  offLight: "#E5E5EA",
};
