import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, RefreshCw } from "lucide-react-native";
import { Colors } from "../lib/theme";
import {
  fetchSpiritualGuidance,
  SpiritualGuidance,
} from "../lib/intelligence";

const DiamondAccent = () => (
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
    {[6, 8, 6].map((size, i) => (
      <View
        key={i}
        style={{
          width: size,
          height: size,
          backgroundColor: i === 1 ? "rgba(135,169,107,0.7)" : "rgba(135,169,107,0.4)",
          transform: [{ rotate: "45deg" }],
        }}
      />
    ))}
  </View>
);

const GuidanceCard = ({
  guidance,
  onReset,
}: {
  guidance: SpiritualGuidance;
  onReset: () => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 8 }}>
      <View className="bg-white rounded-3xl p-8 mb-6 border border-sage/10">
        <Text className="text-center text-sage text-xs tracking-widest uppercase mb-3">
          A Name for You
        </Text>
        <Text
          className="text-center text-charcoal text-4xl mb-2"
          style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
        >
          {guidance.nameArabic}
        </Text>
        <Text className="text-center text-sage text-lg font-semibold mb-1">
          {guidance.nameTransliterated}
        </Text>
        <Text className="text-center text-charcoal-muted text-sm">
          {guidance.nameMeaning}
        </Text>
      </View>

      <View className="bg-white/60 rounded-2xl p-6 mb-8 border border-sage/5">
        <Text
          className="text-charcoal text-base"
          style={{
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            lineHeight: 28,
          }}
        >
          {guidance.message}
        </Text>
      </View>

      <Pressable
        onPress={onReset}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12 }}
      >
        <RefreshCw size={16} color={Colors.sage} />
        <Text className="text-sage text-sm font-medium ml-2">
          Share another feeling
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<SpiritualGuidance | null>(null);

  const handleReflect = useCallback(async () => {
    if (!input.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const result = await fetchSpiritualGuidance(input.trim());
      setGuidance(result);
    } catch (err) {
      console.error("Guidance error:", err);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleReset = () => {
    setGuidance(null);
    setInput("");
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {guidance ? (
            <GuidanceCard guidance={guidance} onReset={handleReset} />
          ) : (
            <>
              <View className="items-center mb-10">
                <DiamondAccent />
                <Text
                  className="text-charcoal text-3xl mb-3 text-center"
                  style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
                >
                  As-Salāmu ʿAlaykum
                </Text>
                <Text className="text-charcoal-muted text-base text-center leading-6" style={{ maxWidth: 280 }}>
                  This is your sanctuary.{"\n"}What weighs on your heart today?
                </Text>
              </View>

              <View className="bg-white rounded-3xl p-5 mb-6 border border-sage/10" style={{ minHeight: 180 }}>
                <TextInput
                  className="flex-1 text-charcoal text-base"
                  style={{
                    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                    textAlignVertical: "top",
                    minHeight: 140,
                    lineHeight: 24,
                  }}
                  placeholder="I feel..."
                  placeholderTextColor={Colors.charcoalMuted}
                  multiline
                  value={input}
                  onChangeText={setInput}
                  maxLength={500}
                />
                <Text className="text-right text-charcoal-muted text-xs mt-2">
                  {input.length}/500
                </Text>
              </View>

              <Pressable
                onPress={handleReflect}
                disabled={loading || !input.trim()}
                className="rounded-2xl py-4"
                style={({ pressed }) => ({
                  backgroundColor: input.trim() ? Colors.sage : "rgba(135,169,107,0.4)",
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Send size={18} color={Colors.white} />
                    <Text className="text-white text-base font-semibold ml-2">
                      Reflect
                    </Text>
                  </>
                )}
              </Pressable>

              <Text className="text-center text-xs mt-8" style={{ color: "rgba(74,74,74,0.3)" }}>
                Your words stay between you and Allah
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
