// components/ScreenHeader.tsx
// ─────────────────────────────────────────────────
// Reusable header with optional title and settings
// gear icon. Uses useColors() for dark mode support.
// ─────────────────────────────────────────────────

import React from "react";
import { View, Pressable } from "react-native";
import { Settings } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useColors } from "../lib/ThemeContext";
import { useAuth } from "../lib/AuthContext";

interface ScreenHeaderProps {
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
  showSettings?: boolean;
}

export default function ScreenHeader({
  children,
  rightContent,
  showSettings = true,
}: ScreenHeaderProps) {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const C = useColors();

  const handleGearPress = () => {
    const root =
      navigation.getParent()?.getParent?.() ||
      navigation.getParent() ||
      navigation;
    root.navigate(user ? "SettingsScreen" : "Auth");
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
      <View style={{ flex: 1 }}>{children}</View>

      {rightContent ? (
        rightContent
      ) : showSettings ? (
        <Pressable onPress={handleGearPress} hitSlop={12} style={{ padding: 4 }}>
          <Settings size={20} color={C.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}