// components/ScreenHeader.tsx
// ─────────────────────────────────────────────────
// Reusable header with optional title and settings
// gear icon. Use at the top of any screen.
// ─────────────────────────────────────────────────

import React from "react";
import { View, Pressable } from "react-native";
import { Settings } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";

interface ScreenHeaderProps {
  children?: React.ReactNode;  // left side content (title, etc.)
  rightContent?: React.ReactNode;  // custom right content (overrides gear)
  showSettings?: boolean;  // default true
}

export default function ScreenHeader({
  children,
  rightContent,
  showSettings = true,
}: ScreenHeaderProps) {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const handleGearPress = () => {
    if (user) {
      // Navigate to settings via root navigator
      const root =
        navigation.getParent()?.getParent?.() ||
        navigation.getParent() ||
        navigation;
      root.navigate("SettingsScreen");
    } else {
      // Not signed in — open auth modal
      const root =
        navigation.getParent()?.getParent?.() ||
        navigation.getParent() ||
        navigation;
      root.navigate("Auth");
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
      }}
    >
      {/* Left side (title, etc.) */}
      <View style={{ flex: 1 }}>{children}</View>

      {/* Right side */}
      {rightContent ? (
        rightContent
      ) : showSettings ? (
        <Pressable
          onPress={handleGearPress}
          hitSlop={12}
          style={{ padding: 4 }}
        >
          <Settings size={20} color={Colors.charcoalMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}