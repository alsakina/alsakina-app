// lib/ThemeContext.tsx
// ─────────────────────────────────────────────────
// Manages light/dark mode state and exposes a
// useColors() hook that all screens should use
// instead of importing Colors directly.
//
// Usage:
//   import { useTheme, useColors } from "../lib/ThemeContext";
//
//   // Get the reactive palette:
//   const C = useColors();
//   <View style={{ backgroundColor: C.background }} />
//
//   // Toggle dark mode (e.g. in SettingsScreen):
//   const { isDark, toggle } = useTheme();
// ─────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightColors, DarkColors, AppColors } from "./theme";

const STORAGE_KEY = "@al_sakina_dark_mode";

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
  colors: AppColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggle: () => {},
  colors: LightColors,
});

export const useTheme = () => useContext(ThemeContext);

/** Returns the reactive color palette for the current theme. */
export const useColors = (): AppColors => useContext(ThemeContext).colors;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      setIsDark(val === "true");
      setLoaded(true);
    });
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem(STORAGE_KEY, next ? "true" : "false");
  };

  // Don't render until preference is loaded (prevents flash of wrong theme)
  if (!loaded) return null;

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}