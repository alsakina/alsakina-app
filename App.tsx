// App.tsx
// ─────────────────────────────────────────────────
// ThemeProvider must wrap NavigationContainer so
// that TabNavigator and all screens can call
// useColors() / useTheme() during render.
// ─────────────────────────────────────────────────

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/lib/AuthContext";
import { PremiumProvider } from "./src/lib/PremiumContext";
import { ThemeProvider } from "./src/lib/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <PremiumProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </PremiumProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}