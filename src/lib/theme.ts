// lib/theme.ts
// ─────────────────────────────────────────────────
// Light and dark color palettes.
// Never import Colors directly in components —
// use the useColors() hook from ThemeContext instead
// so dark mode re-renders work correctly.
//
// The static `Colors` export is kept for the rare
// cases that genuinely need it outside React
// (e.g. navigation screenOptions callbacks).
// ─────────────────────────────────────────────────

export const LightColors = {
  // Backgrounds
  background: "#FDFBF7",   // cream
  surface: "#FFFFFF",       // cards, inputs
  surfaceAlt: "#F5F3EE",   // slightly off-white for nested cards

  // Brand
  sage: "#87A96B",
  sageLight: "#A8C68F",
  sageDark: "#6B8A52",
  sageFaint: "rgba(135,169,107,0.08)",
  sageFaintMid: "rgba(135,169,107,0.15)",

  // Text
  text: "#4A4A4A",          // primary text
  textLight: "#6E6E6E",
  textMuted: "#9A9A9A",

  // Borders / dividers
  border: "rgba(135,169,107,0.10)",
  borderStrong: "rgba(135,169,107,0.20)",

  // Status
  error: "#b44444",
  errorFaint: "rgba(180,68,68,0.08)",

  // Misc
  white: "#FFFFFF",
  black: "#000000",
  tabBar: "#FDFBF7",
} as const;

export const DarkColors = {
  // Backgrounds
  background: "#1A1A1A",
  surface: "#252525",
  surfaceAlt: "#2E2E2E",

  // Brand (sage stays recognisable, just slightly brighter)
  sage: "#95BA78",
  sageLight: "#A8C68F",
  sageDark: "#7AA05E",
  sageFaint: "rgba(149,186,120,0.10)",
  sageFaintMid: "rgba(149,186,120,0.18)",

  // Text
  text: "#E8E3D8",
  textLight: "#B8B0A0",
  textMuted: "#7A7268",

  // Borders / dividers
  border: "rgba(149,186,120,0.12)",
  borderStrong: "rgba(149,186,120,0.22)",

  // Status
  error: "#e06060",
  errorFaint: "rgba(224,96,96,0.12)",

  // Misc
  white: "#FFFFFF",
  black: "#000000",
  tabBar: "#1E1E1E",
} as const;

export type AppColors = typeof LightColors;

// ── Legacy static export ────────────────────────
// Used only in navigation option objects (non-React callbacks).
// For all React components, use useColors() instead.
export const Colors = {
  cream: LightColors.background,
  sage: LightColors.sage,
  sageLight: LightColors.sageLight,
  sageDark: LightColors.sageDark,
  charcoal: LightColors.text,
  charcoalLight: LightColors.textLight,
  charcoalMuted: LightColors.textMuted,
  white: "#FFFFFF",
};

// Kept for ThemeContext backward compatibility
export function setDarkMode(_dark: boolean) {
  // No-op: theming is now handled reactively via useColors()
}