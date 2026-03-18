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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Send, RefreshCw, Sparkles, Bookmark, ChevronLeft } from "lucide-react-native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";
import { usePremium, FREE_REFLECTIONS_PER_MONTH } from "../lib/PremiumContext";
import { supabase } from "../lib/supabase";
import { encryptJournalEntry } from "../lib/encryption";
import ScreenHeader from "../components/ScreenHeader";
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
        style={{
          backgroundColor: "white",
          borderRadius: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: "rgba(135,169,107,0.1)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Arabic name */}
        <Text
          style={{
            textAlign: "center",
            color: Colors.charcoal,
            fontSize: 30,
            marginBottom: 4,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          }}
        >
          {name.arabic}
        </Text>

        {/* Transliteration + meaning */}
        <Text
          style={{
            textAlign: "center",
            color: Colors.sage,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {name.transliteration}
        </Text>
        <Text
          style={{
            textAlign: "center",
            color: Colors.charcoalMuted,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
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
          style={{
            color: Colors.charcoal,
            fontSize: 14,
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
  onSave,
  saved,
}: {
  guidance: SpiritualGuidance;
  onReset: () => void;
  onSave: () => void;
  saved: boolean;
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
        <Text
          style={{
            textAlign: "center",
            color: Colors.sage,
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
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
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(135,169,107,0.05)",
            }}
          >
            <Text
              style={{
                color: Colors.charcoal,
                fontSize: 14,
                textAlign: "center",
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

      {/* Action buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          marginTop: 8,
          paddingVertical: 12,
        }}
      >
        {/* Save to journal */}
        <Pressable onPress={() => { if (!saved) onSave(); }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Bookmark
              size={16}
              color={saved ? Colors.sage : Colors.charcoalMuted}
              fill={saved ? Colors.sage : "transparent"}
            />
            <Text
              style={{
                color: saved ? Colors.sage : Colors.charcoalMuted,
                fontSize: 14,
                fontWeight: "500",
                marginLeft: 6,
              }}
            >
              {saved ? "Saved" : "Save to Journal"}
            </Text>
          </View>
        </Pressable>

        {/* Divider dot */}
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: "rgba(135,169,107,0.3)",
          }}
        />

        {/* New reflection */}
        <Pressable onPress={onReset}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RefreshCw size={16} color={Colors.charcoalMuted} />
            <Text
              style={{
                color: Colors.charcoalMuted,
                fontSize: 14,
                fontWeight: "500",
                marginLeft: 6,
              }}
            >
              New reflection
            </Text>
          </View>
        </Pressable>
      </View>
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
    <Pressable
      onPress={onDismiss}
      style={{ marginTop: 8, alignItems: "center" }}
    >
      <Text style={{ color: Colors.sage, fontSize: 13, fontWeight: "600" }}>
        Dismiss
      </Text>
    </Pressable>
  </View>
);

/* ── Main screen ───────────────────────────────── */

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { isPremium, canReflect, reflectionsLeft, incrementReflection } =
    usePremium();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<SpiritualGuidance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleReflect = useCallback(async () => {
    // If not signed in, prompt auth first (no text required)
    if (!user) {
      navigation.navigate("Auth");
      return;
    }

    // If free user is out of reflections, show paywall (no text required)
    if (!canReflect) {
      navigation.navigate("Paywall");
      return;
    }

    if (!input.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const result = await fetchSpiritualGuidance(input.trim());
      setGuidance(result);

      // Track usage for free users
      await incrementReflection();
    } catch (err: any) {
      console.error("Guidance error:", err);
      setError(
        "Something went wrong reaching the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [input, user, canReflect]);

  const handleSaveToJournal = async () => {
    if (!user || !guidance) {
      if (!user) {
        navigation.navigate("Auth");
      }
      return;
    }

    try {
      const namesText = guidance.names
        .map(
          (n) =>
            `${n.arabic} — ${n.transliteration} (${n.meaning})\n${n.explanation}`
        )
        .join("\n\n");

      const title = `Reflection: ${input.slice(0, 50)}${input.length > 50 ? "…" : ""}`;
      const body = `My reflection: "${input}"\n\n${namesText}${
        guidance.closingReflection
          ? `\n\n${guidance.closingReflection}`
          : ""
      }`;

      // Try to encrypt, fall back to plaintext if it fails
      let saveTitle = title;
      let saveBody = body;
      try {
        const encrypted = await encryptJournalEntry({ title, body });
        saveTitle = encrypted.title || title;
        saveBody = encrypted.body;
      } catch (encErr) {
        console.warn("Encryption failed, saving as plaintext:", encErr);
      }

      const { error: dbError } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: saveTitle,
        body: saveBody,
        mood: null,
      });

      if (dbError) throw dbError;

      setSaved(true);
    } catch (err: any) {
      console.error("Save error:", err);
      Alert.alert("Could not save", err.message || "Please try again.");
    }
  };

  const handleReset = () => {
    setGuidance(null);
    setInput("");
    setError(null);
    setSaved(false);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      edges={["top"]}
    >
      {guidance ? (
        <ScreenHeader>
          <Pressable onPress={handleReset} hitSlop={12}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ChevronLeft size={22} color={Colors.sage} />
              <Text style={{ color: Colors.sage, fontSize: 15, marginLeft: 2 }}>
                New Reflection
              </Text>
            </View>
          </Pressable>
        </ScreenHeader>
      ) : (
        <ScreenHeader />
      )}
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
            <GuidanceResult
              guidance={guidance}
              onReset={handleReset}
              onSave={handleSaveToJournal}
              saved={saved}
            />
          ) : (
            <>
              {/* Header */}
              <View style={{ alignItems: "center", marginBottom: 40 }}>
                <DiamondAccent />
                <Text
                  style={{
                    color: Colors.charcoal,
                    fontSize: 30,
                    marginBottom: 12,
                    textAlign: "center",
                    fontFamily:
                      Platform.OS === "ios" ? "Georgia" : "serif",
                  }}
                >
                  As-Salāmu ʿAlaykum
                </Text>
                <Text
                  style={{
                    color: Colors.charcoalMuted,
                    fontSize: 16,
                    textAlign: "center",
                    lineHeight: 24,
                    maxWidth: 280,
                  }}
                >
                  This is your sanctuary.{"\n"}What weighs on your heart
                  today?
                </Text>
              </View>

              {/* Input area */}
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 24,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(135,169,107,0.1)",
                  minHeight: 120,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    color: Colors.charcoal,
                    fontSize: 16,
                    fontFamily:
                      Platform.OS === "ios" ? "Georgia" : "serif",
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
                <Text
                  style={{
                    textAlign: "right",
                    color: Colors.charcoalMuted,
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  {input.length}/500
                </Text>
              </View>

              {/* Reflection counter / sign-in prompt */}
              <View
                style={{
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                {!user ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.charcoalMuted,
                      fontStyle: "italic",
                    }}
                  >
                    Sign in to receive personalized reflections
                  </Text>
                ) : !isPremium ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: canReflect
                        ? Colors.charcoalMuted
                        : "#b44",
                      fontStyle: "italic",
                    }}
                  >
                    {canReflect
                      ? `${reflectionsLeft} of ${FREE_REFLECTIONS_PER_MONTH} free reflections remaining this month`
                      : "You've used all free reflections this month"}
                  </Text>
                ) : null}
              </View>

              {/* Submit button */}
              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Pressable
                  onPress={handleReflect}
                  disabled={loading || (!!user && canReflect && !input.trim())}
                >
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      paddingVertical: 14,
                      paddingHorizontal: 40,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: Colors.sage,
                      backgroundColor:
                        !user || !canReflect
                          ? Colors.sage
                          : "transparent",
                      opacity:
                        user && canReflect && !input.trim() ? 0.4 : 1,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color={!user || !canReflect ? "white" : Colors.sage}
                      />
                    ) : !user ? (
                      <>
                        <Send size={18} color="white" />
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "600",
                            marginLeft: 8,
                          }}
                        >
                          Sign In to Reflect
                        </Text>
                      </>
                    ) : !canReflect ? (
                      <>
                        <Sparkles size={18} color="white" />
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            fontWeight: "600",
                            marginLeft: 8,
                          }}
                        >
                          Upgrade to Reflect
                        </Text>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </View>
                </Pressable>
              </View>

              {/* Error */}
              {error ? (
                <ErrorBanner
                  message={error}
                  onDismiss={() => setError(null)}
                />
              ) : null}

              {/* Privacy note */}
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "rgba(74,74,74,0.3)",
                  marginTop: 32,
                }}
              >
                Your words are between you and Allah
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}