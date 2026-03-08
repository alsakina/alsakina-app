import React from "react";
import { View, Text, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sprout } from "lucide-react-native";
import { Colors } from "../lib/theme";

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="flex-1 justify-center items-center px-8">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-5" style={{ backgroundColor: "rgba(135,169,107,0.1)" }}>
          <Sprout size={28} color={Colors.sage} />
        </View>
        <Text className="text-charcoal text-2xl mb-3 text-center" style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}>
          The Garden
        </Text>
        <Text className="text-charcoal-muted text-sm text-center leading-5" style={{ maxWidth: 260 }}>
          Daily nourishment. A fresh verse and hadith planted here each morning for you to carry through the day.
        </Text>
        <View className="mt-6 rounded-xl px-4 py-2" style={{ backgroundColor: "rgba(135,169,107,0.1)" }}>
          <Text className="text-sage text-xs font-medium tracking-widest uppercase">Coming Next</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
