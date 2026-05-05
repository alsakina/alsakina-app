// App.tsx
// ─────────────────────────────────────────────────
// ThemeProvider must wrap NavigationContainer so
// that TabNavigator and all screens can call
// useColors() / useTheme() during render.
// ─────────────────────────────────────────────────

import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/lib/AuthContext";
import { PremiumProvider } from "./src/lib/PremiumContext";
import { ThemeProvider, useTheme } from "./src/lib/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

// Separate component so it can consume ThemeContext via useTheme()
function AppShell() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <PremiumProvider>
              <AppShell />
            </PremiumProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}