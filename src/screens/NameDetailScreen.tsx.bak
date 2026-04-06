// screens/NameDetailScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, RefreshCw, BookOpen, Sparkles } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../lib/theme";
import { fetchNameDetail, NameDetail } from "../lib/intelligence";
import { NAME_DETAILS } from "../lib/nameDetailsData";

/* ── Types for route params ────────────────────── */

interface RouteParams {
  id: number;
  arabic: string;
  transliteration: string;
  meaning: string;
}

/* ── Cache key helper ──────────────────────────── */

const cacheKey = (id: number) => `@name_detail_${id}`;

/* ── Section component ─────────────────────────── */

const Section = ({
  title,
  icon,
  children,
  index,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  index: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200 + index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 200 + index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 24,
      }}
    >
      {/* Section heading */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {icon}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: Colors.sage,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginLeft: icon ? 8 : 0,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Section body */}
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: "rgba(135,169,107,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
};

/* ── Quran verse card ──────────────────────────── */

const VerseCard = ({
  arabic,
  translation,
  reference,
}: {
  arabic?: string;
  translation: string;
  reference: string;
}) => (
  <View
    style={{
      backgroundColor: "rgba(135,169,107,0.05)",
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: "rgba(135,169,107,0.4)",
    }}
  >
    {arabic ? (
      <Text
        style={{
          fontSize: 20,
          color: Colors.charcoal,
          textAlign: "right",
          fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          lineHeight: 34,
          marginBottom: 10,
        }}
      >
        {arabic}
      </Text>
    ) : null}
    <Text
      style={{
        fontSize: 14,
        color: Colors.charcoal,
        fontStyle: "italic",
        lineHeight: 22,
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      }}
    >
      "{translation}"
    </Text>
    <Text
      style={{
        fontSize: 12,
        color: Colors.sage,
        fontWeight: "600",
        marginTop: 8,
      }}
    >
      — {reference}
    </Text>
  </View>
);

/* ── Detail content renderer ───────────────────── */

const DetailContent = ({ detail }: { detail: NameDetail }) => (
  <>
    {/* Overview */}
    <Section title="Overview" index={0}>
      <Text
        style={{
          fontSize: 15,
          color: Colors.charcoal,
          lineHeight: 26,
          fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        }}
      >
        {detail.overview}
      </Text>
    </Section>

    {/* Quranic Verses */}
    {detail.quranicVerses.length > 0 && (
      <Section
        title="In the Quran"
        icon={<BookOpen size={15} color={Colors.sage} />}
        index={1}
      >
        {detail.quranicVerses.map((verse, i) => (
          <VerseCard
            key={i}
            arabic={verse.arabic}
            translation={verse.translation}
            reference={verse.reference}
          />
        ))}
      </Section>
    )}

    {/* Prophetic stories */}
    {detail.propheticStories.length > 0 && (
      <Section title="Stories of the Prophets" index={2}>
        {detail.propheticStories.map((story, i) => (
          <View
            key={i}
            style={{
              marginBottom:
                i < detail.propheticStories.length - 1 ? 16 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: Colors.charcoal,
                marginBottom: 6,
              }}
            >
              {story.title}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.charcoal,
                lineHeight: 24,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              }}
            >
              {story.narrative}
            </Text>
          </View>
        ))}
      </Section>
    )}

    {/* Application today */}
    <Section title="Applying This Name Today" index={3}>
      <Text
        style={{
          fontSize: 14,
          color: Colors.charcoal,
          lineHeight: 24,
          fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        }}
      >
        {detail.applicationToday}
      </Text>
    </Section>

    {/* Du'a */}
    {detail.dua ? (
      <Section title="A Du'a to Reflect On" index={4}>
        {detail.dua.arabic ? (
          <Text
            style={{
              fontSize: 20,
              color: Colors.charcoal,
              textAlign: "center",
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              lineHeight: 34,
              marginBottom: 10,
            }}
          >
            {detail.dua.arabic}
          </Text>
        ) : null}
        <Text
          style={{
            fontSize: 14,
            color: Colors.charcoal,
            fontStyle: "italic",
            textAlign: "center",
            lineHeight: 22,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          }}
        >
          "{detail.dua.translation}"
        </Text>
        {detail.dua.source ? (
          <Text
            style={{
              fontSize: 12,
              color: Colors.sage,
              fontWeight: "600",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            — {detail.dua.source}
          </Text>
        ) : null}
      </Section>
    ) : null}
  </>
);

/* ── Main screen ───────────────────────────────── */

export default function NameDetailScreen({
  route,
  navigation,
}: {
  route: { params: RouteParams };
  navigation: any;
}) {
  const { id, arabic, transliteration, meaning } = route.params;
  const [detail, setDetail] = useState<NameDetail | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadDetail();
  }, []);

  /* Load detail: check AsyncStorage cache first, then fall back to static data */
  const loadDetail = async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey(id));
      if (cached) {
        setDetail(JSON.parse(cached));
        setIsCustom(true);
        return;
      }
    } catch (err) {
      console.warn("Cache read error:", err);
    }

    // Fall back to pre-generated static data
    const staticDetail = NAME_DETAILS[id];
    if (staticDetail) {
      setDetail(staticDetail);
      setIsCustom(false);
    }
  };

  /* Regenerate: call the API, cache the result, display it */
  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const fresh = await fetchNameDetail(transliteration, arabic, meaning);
      await AsyncStorage.setItem(cacheKey(id), JSON.stringify(fresh));
      setDetail(fresh);
      setIsCustom(true);
    } catch (err: any) {
      console.error("Regenerate error:", err);
      Alert.alert(
        "Could not regenerate",
        "Please check your connection and try again."
      );
    } finally {
      setRegenerating(false);
    }
  };

  /* Reset back to the original pre-generated content */
  const handleResetToOriginal = async () => {
    try {
      await AsyncStorage.removeItem(cacheKey(id));
    } catch (err) {
      console.warn("Cache clear error:", err);
    }
    const staticDetail = NAME_DETAILS[id];
    if (staticDetail) {
      setDetail(staticDetail);
      setIsCustom(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      edges={["top"]}
    >
      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ChevronLeft size={22} color={Colors.sage} />
          <Text style={{ color: Colors.sage, fontSize: 15, marginLeft: 2 }}>
            Back
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Arabic name */}
        <Animated.View
          style={{
            opacity: headerFade,
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          {/* Number diamond */}
          <View
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 30,
                height: 30,
                borderRadius: 6,
                backgroundColor: "rgba(135,169,107,0.12)",
                transform: [{ rotate: "45deg" }],
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: Colors.sage,
              }}
            >
              {id}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 42,
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            {arabic}
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: Colors.sage,
              marginBottom: 4,
            }}
          >
            {transliteration}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: Colors.charcoalMuted,
            }}
          >
            {meaning}
          </Text>

          {/* Decorative divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 20,
              gap: 6,
            }}
          >
            <View
              style={{
                width: 40,
                height: 1,
                backgroundColor: "rgba(135,169,107,0.2)",
              }}
            />
            <View
              style={{
                width: 5,
                height: 5,
                backgroundColor: "rgba(135,169,107,0.4)",
                transform: [{ rotate: "45deg" }],
              }}
            />
            <View
              style={{
                width: 40,
                height: 1,
                backgroundColor: "rgba(135,169,107,0.2)",
              }}
            />
          </View>
        </Animated.View>

        {/* Content */}
        {detail ? (
          <>
            <DetailContent detail={detail} />

            {/* ── Bottom actions ───────────────── */}
            <View
              style={{
                marginTop: 8,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: "rgba(135,169,107,0.1)",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Regenerate button */}
              <Pressable
                onPress={handleRegenerate}
                disabled={regenerating}
                style={({ pressed }) => ({
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 13,
                  paddingHorizontal: 28,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: Colors.sage,
                  backgroundColor: "transparent",
                  opacity: regenerating ? 0.5 : pressed ? 0.7 : 1,
                })}
              >
                {regenerating ? (
                  <ActivityIndicator size="small" color={Colors.sage} />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Sparkles size={16} color={Colors.sage} />
                    <Text
                      style={{
                        color: Colors.sage,
                        fontSize: 14,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      Generate new explanation
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Reset to original (only show if viewing a regenerated version) */}
              {isCustom && (
                <Pressable
                  onPress={handleResetToOriginal}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <RefreshCw size={14} color={Colors.charcoalMuted} />
                  <Text
                    style={{
                      color: Colors.charcoalMuted,
                      fontSize: 13,
                      marginLeft: 6,
                    }}
                  >
                    Reset to original
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          /* No static data and no cache — shouldn't happen but handle gracefully */
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text
              style={{
                color: Colors.charcoalMuted,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              No details available for this name yet.
            </Text>
            <Pressable
              onPress={handleRegenerate}
              disabled={regenerating}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 16,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: Colors.sage,
              }}
            >
              {regenerating ? (
                <ActivityIndicator size="small" color={Colors.sage} />
              ) : (
                <>
                  <Sparkles size={16} color={Colors.sage} />
                  <Text
                    style={{
                      color: Colors.sage,
                      fontSize: 14,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    Generate explanation
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}