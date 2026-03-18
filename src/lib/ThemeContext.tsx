// lib/ThemeContext.tsx
// ─────────────────────────────────────────────────
// Manages light/dark mode state.
// Calls setDarkMode() on theme.ts to update Colors,
// then triggers a re-render cascade so all screens
// pick up the new values automatically.
//
// Usage:
//   import { useTheme } from "../lib/ThemeContext";
//   const { isDark, toggle } = useTheme();
// ─────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setDarkMode } from "./theme";

const STORAGE_KEY = "@al_sakina_dark_mode";

interface ThemeContextType {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      const dark = val === "true";
      setIsDark(dark);
      setDarkMode(dark); // sync the getter-based Colors immediately
      setLoaded(true);
    });
  }, []);

  // Keep Colors in sync whenever isDark changes
  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem(STORAGE_KEY, next ? "true" : "false");
  };

  // Don't render until we know the preference (prevents flash of wrong theme)
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}