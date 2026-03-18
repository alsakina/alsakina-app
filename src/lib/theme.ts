// lib/theme.ts
// ─────────────────────────────────────────────────
// Getter-based Colors object that automatically returns
// the right values for light or dark mode.
//
// All screens import { Colors } from this file and
// use Colors.cream, Colors.sage, etc. as before — 
// no changes needed in any screen file.
//
// ThemeContext calls setDarkMode() to switch palettes.
// The context change triggers a full tree re-render,
// and all Components pick up the new values via getters.
// ─────────────────────────────────────────────────

export interface ColorPalette {
  cream: string;
  sage: string;
  charcoal: string;
  charcoalMuted: string;
  card: string;
  cardBorder: string;
  inputBg: string;
  divider: string;
  sageAlpha: (opacity: number) => string;
}

const LightPalette: ColorPalette = {
  cream: "#FDFBF7",
  sage: "#87A96B",
  charcoal: "#4A4A4A",
  charcoalMuted: "#4A4A4A99",
  card: "#FFFFFF",
  cardBorder: "rgba(135,169,107,0.08)",
  inputBg: "#FFFFFF",
  divider: "rgba(135,169,107,0.12)",
  sageAlpha: (o: number) => `rgba(135,169,107,${o})`,
};

const DarkPalette: ColorPalette = {
  cream: "#1A1916",
  sage: "#9BBF8A",
  charcoal: "#E8E0D8",
  charcoalMuted: "#9B9590",
  card: "#262420",
  cardBorder: "rgba(155,191,138,0.12)",
  inputBg: "#2C2A26",
  divider: "rgba(155,191,138,0.08)",
  sageAlpha: (o: number) => `rgba(155,191,138,${o})`,
};

/* ── Mutable backing ───────────────────────────── */

let _current: ColorPalette = LightPalette;
let _isDark = false;

export function setDarkMode(dark: boolean) {
  _isDark = dark;
  _current = dark ? DarkPalette : LightPalette;
}

export function isDarkMode(): boolean {
  return _isDark;
}

/* ── Getter-based Colors export ────────────────── */
// Every read of Colors.cream, Colors.sage, etc.
// returns the current palette value at read-time.

export const Colors = {
  get cream() { return _current.cream; },
  get sage() { return _current.sage; },
  get charcoal() { return _current.charcoal; },
  get charcoalMuted() { return _current.charcoalMuted; },
  get card() { return _current.card; },
  get cardBorder() { return _current.cardBorder; },
  get inputBg() { return _current.inputBg; },
  get divider() { return _current.divider; },
  get sageAlpha() { return _current.sageAlpha; },
};