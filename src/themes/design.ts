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
  accent: "#007AFF",
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
  chipSelectedBg: "#000000",
  chipSelectedText: "#ffffff",
  chipUnselectedBg: "rgba(0,0,0,0.06)",
  secDomBadgeBg: "#f59e0b",
  secDomBadgeText: "#ffffff",
  borrowedBadgeBg: "#06b6d4",
  borrowedBadgeText: "#ffffff",

  // ContextMenu
  contextMenuBg: "rgba(255,255,255,0.98)",
  contextMenuDivider: "rgba(0,0,0,0.1)",
  contextMenuIconStroke: "#3c3c4399",

  // Layer list
  layerCheckboxBorder: "rgba(0,0,0,0.22)",
  dragPlaceholderBorder: "rgba(0,0,0,0.07)",
  dragPlaceholderBg: "rgba(0,0,0,0.03)",

  // PillButton danger
  pillDangerBorder: "rgba(239,68,68,0.25)",
  pillDangerBg: "rgba(254,226,226,0.7)",

  // Color swatch
  colorSwatchBorder: "rgba(0,0,0,0.12)",

  // Fretboard
  fretString: "rgba(0,0,0,0.09)",
  fretLine: "rgba(0,0,0,0.05)",
  fretNutGray: "#7a7a7a",

  // Glass button
  glassIconColor: "rgba(0,0,0,0.5)",

  // Stats heatmap
  heatmapEmpty: "rgba(156,163,175,0.3)",
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
  accent: "#5AA9FF",
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
  chipSelectedBg: "#ffffff",
  chipSelectedText: "#000000",
  chipUnselectedBg: "rgba(255,255,255,0.08)",
  secDomBadgeBg: "#d97706",
  secDomBadgeText: "#ffffff",
  borrowedBadgeBg: "#0891b2",
  borrowedBadgeText: "#ffffff",

  // ContextMenu
  contextMenuBg: "rgba(38,38,40,0.98)",
  contextMenuDivider: "rgba(255,255,255,0.12)",
  contextMenuIconStroke: "#ebebf599",

  // Layer list
  layerCheckboxBorder: "rgba(255,255,255,0.28)",
  dragPlaceholderBorder: "rgba(255,255,255,0.06)",
  dragPlaceholderBg: "rgba(255,255,255,0.05)",

  // PillButton danger
  pillDangerBorder: "rgba(239,68,68,0.3)",
  pillDangerBg: "rgba(239,68,68,0.08)",

  // Color swatch
  colorSwatchBorder: "rgba(255,255,255,0.15)",

  // Fretboard
  fretString: "rgba(255,255,255,0.12)",
  fretLine: "rgba(255,255,255,0.06)",
  fretNutGray: "#9a9a9a",

  // Glass button
  glassIconColor: "rgba(255,255,255,0.85)",

  // Stats heatmap
  heatmapEmpty: "rgba(107,114,128,0.3)",
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
  accent: string;
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
  chipSelectedBg: string;
  chipSelectedText: string;
  chipUnselectedBg: string;
  secDomBadgeBg: string;
  secDomBadgeText: string;
  borrowedBadgeBg: string;
  borrowedBadgeText: string;

  contextMenuBg: string;
  contextMenuDivider: string;
  contextMenuIconStroke: string;

  layerCheckboxBorder: string;
  dragPlaceholderBorder: string;
  dragPlaceholderBg: string;

  pillDangerBorder: string;
  pillDangerBg: string;

  colorSwatchBorder: string;

  fretString: string;
  fretLine: string;
  fretNutGray: string;

  glassIconColor: string;

  heatmapEmpty: string;
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

// ── Overlay / modal ───────────────────────────────────────────────────────────

export const OVERLAY_COLORS = {
  dim: "rgba(0,0,0,0.25)",
  sheet: "rgba(0,0,0,0.45)",
  handle: "rgba(128,128,128,0.45)",
};

// ── Surface dividers ──────────────────────────────────────────────────────────

export const SURFACE_DIVIDER = "rgba(128,128,128,0.2)";

// ── On-accent-color surface (always white-toned — used on layer/accent bg) ───

export const ON_ACCENT = {
  chipBorder: "rgba(255,255,255,0.5)",
  dotBorder: "rgba(0,0,0,0.15)",
  text: "rgba(255,255,255,0.8)",
  iconStroke: "rgba(255,255,255,0.7)",
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

export const DEFAULT_LAYER_COLORS = ["#ff69b6", "#40e0d0", "#ffd700", "#a78bfa"];

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

// ── Diatonic chord function badge colors ──────────────────────────────────────

export const DIATONIC_FUNCTION_COLORS: Record<"T" | "SD" | "D", string> = {
  T: "#007AFF",
  SD: "#34C759",
  D: "#FF9500",
};

// ── Circle of Fifths overlay colors (drawn from COLOR_PRESETS for consistency) ─

export const RELATED_KEY_COLORS: Record<"tonic" | "dominant" | "subdominant" | "parallel", string> =
  {
    tonic: "#ff4d4d",
    dominant: "#84cc16",
    subdominant: "#00bfff",
    parallel: "#a78bfa",
  };

export const CIRCLE_OVERLAY_COLORS = {
  secondaryDominant: "#ff8c00",
  tritoneSub: "#40e0d0",
  modalInterchange: "#c084fc",
} as const;
