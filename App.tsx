// App.tsx (or your root entry point)
// ─────────────────────────────────────────────────
// Wrap the app with Auth and Premium providers.
// Adjust to match your existing App.tsx structure.
// ─────────────────────────────────────────────────

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/lib/AuthContext";
import { PremiumProvider } from "./src/lib/PremiumContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PremiumProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PremiumProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}