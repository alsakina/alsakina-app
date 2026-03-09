// screens/HomeScreen.tsx
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
  DivineName,
} from "../lib/intelligence";

/* ── Decorative diamond row ────────────────────── */

const DiamondAccent = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 8,
    }}
  >
    {[6, 8, 6].map((size, i) => (
      <View
        key={i}
        style={{
          width: size,
          height: size,
          backgroundColor:
            i === 1 ? "rgba(135,169,107,0.7)" : "rgba(135,169,107,0.4)",
          transform: [{ rotate: "45deg" }],
        }}
      />
    ))}
  </View>
);

/* ── Single Name card (stagger-animated) ───────── */

const NameCard = ({
  name,
  index,
}: {
  name: DivineName;
  index: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 16,
      }}
    >
      <View
        className="bg-white rounded-3xl p-6 border border-sage/10"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Arabic name */}
        <Text
          className="text-center text-charcoal text-3xl mb-1"
          style={{
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          }}
        >
          {name.arabic}
        </Text>

        {/* Transliteration + meaning */}
        <Text className="text-center text-sage text-base font-semibold">
          {name.transliteration}
        </Text>
        <Text className="text-center text-charcoal-muted text-sm mb-4">
          {name.meaning}
        </Text>

        {/* Thin divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "rgba(135,169,107,0.15)",
            marginBottom: 12,
          }}
        />

        {/* Explanation */}
        <Text
          className="text-charcoal text-sm"
          style={{
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            lineHeight: 24,
          }}
        >
          {name.explanation}
        </Text>
      </View>
    </Animated.View>
  );
};

/* ── Full guidance result view ─────────────────── */

const GuidanceResult = ({
  guidance,
  onReset,
}: {
  guidance: SpiritualGuidance;
  onReset: () => void;
}) => {
  const headerFade = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={{ paddingHorizontal: 4 }}>
      {/* Section header */}
      <Animated.View style={{ opacity: headerFade, marginBottom: 20 }}>
        <DiamondAccent />
        <Text className="text-center text-sage text-xs tracking-widest uppercase mb-1">
          Names for Your Heart
        </Text>
      </Animated.View>

      {/* Name cards */}
      {guidance.names.map((name, i) => (
        <NameCard key={name.transliteration + i} name={name} index={i} />
      ))}

      {/* Closing reflection */}
      {guidance.closingReflection ? (
        <Animated.View
          style={{
            opacity: headerFade,
            marginTop: 4,
            marginBottom: 24,
            paddingHorizontal: 8,
          }}
        >
          <View className="bg-white/60 rounded-2xl p-5 border border-sage/5">
            <Text
              className="text-charcoal text-sm text-center"
              style={{
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                lineHeight: 24,
                fontStyle: "italic",
              }}
            >
              {guidance.closingReflection}
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {/* Reset button */}
      <Pressable
        onPress={onReset}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
        }}
      >
        <RefreshCw size={16} color={Colors.sage} />
        <Text className="text-sage text-sm font-medium ml-2">
          Share another feeling
        </Text>
      </Pressable>
    </View>
  );
};

/* ── Error banner ──────────────────────────────── */

const ErrorBanner = ({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) => (
  <View
    style={{
      backgroundColor: "rgba(220,80,80,0.08)",
      borderRadius: 12,
      padding: 14,
      marginTop: 16,
    }}
  >
    <Text
      style={{
        color: "#b44",
        fontSize: 13,
        textAlign: "center",
        lineHeight: 20,
      }}
    >
      {message}
    </Text>
    <Pressable onPress={onDismiss} style={{ marginTop: 8, alignItems: "center" }}>
      <Text style={{ color: Colors.sage, fontSize: 13, fontWeight: "600" }}>
        Dismiss
      </Text>
    </Pressable>
  </View>
);

/* ── Main screen ───────────────────────────────── */

export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<SpiritualGuidance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReflect = useCallback(async () => {
    if (!input.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const result = await fetchSpiritualGuidance(input.trim());
      setGuidance(result);
    } catch (err: any) {
      console.error("Guidance error:", err);
      setError(
        "Something went wrong reaching the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleReset = () => {
    setGuidance(null);
    setInput("");
    setError(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: guidance ? "flex-start" : "center",
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {guidance ? (
            <GuidanceResult guidance={guidance} onReset={handleReset} />
          ) : (
            <>
              {/* Header */}
              <View className="items-center mb-10">
                <DiamondAccent />
                <Text
                  className="text-charcoal text-3xl mb-3 text-center"
                  style={{
                    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  }}
                >
                  As-Salāmu ʿAlaykum
                </Text>
                <Text
                  className="text-charcoal-muted text-base text-center leading-6"
                  style={{ maxWidth: 280 }}
                >
                  This is your sanctuary.{"\n"}What weighs on your heart
                  today?
                </Text>
              </View>

              {/* Input area */}
              <View
                className="bg-white rounded-3xl p-5 border border-sage/10"
                style={{ minHeight: 120 }}
              >
                <TextInput
                  className="flex-1 text-charcoal text-base"
                  style={{
                    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                    textAlignVertical: "top",
                    minHeight: 80,
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

              {/* Submit button */}
              <View style={{ alignItems: "center", marginTop: 20 }}>
                <Pressable
                  onPress={handleReflect}
                  disabled={loading || !input.trim()}
                  style={({ pressed }) => ({
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 40,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: Colors.sage,
                    backgroundColor: "transparent",
                    opacity: !input.trim() ? 0.4 : pressed ? 0.7 : 1,
                  })}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.sage} />
                  ) : (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Send size={18} color={Colors.sage} />
                      <Text
                        style={{
                          color: Colors.sage,
                          fontSize: 16,
                          fontWeight: "600",
                          marginLeft: 8,
                        }}
                      >
                        Reflect
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Error */}
              {error ? (
                <ErrorBanner
                  message={error}
                  onDismiss={() => setError(null)}
                />
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}