// navigation/RootNavigator.tsx
// ─────────────────────────────────────────────────
// Top-level navigator. The tab bar is always visible.
// Auth and Paywall are presented as modals on top.
// ─────────────────────────────────────────────────

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import AuthScreen from "../screens/AuthScreen";
import PaywallScreen from "../screens/PaywallScreen";
import DailyContentScreen from "../screens/DailyContentScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="DailyContentScreen"
        component={DailyContentScreen}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
      />
    </Stack.Navigator>
  );
}