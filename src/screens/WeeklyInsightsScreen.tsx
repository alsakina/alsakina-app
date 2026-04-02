// screens/WeeklyInsightsScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  TrendingUp,
  Heart,
  BookOpen,
  Lightbulb,
  HandHeart,
  BarChart3,
  RefreshCw,
  Bookmark,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { decryptJournalEntry, encryptJournalEntry } from "../lib/encryption";
import { fetchWeeklyInsights, WeeklyInsight } from "../lib/intelligence";

/* ── Section ───────────────────────────────────── */

const InsightSection = ({
  icon,
  title,
  body,
  color,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  color: string;
  delay: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
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
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: "rgba(135,169,107,0.08)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${color}15`,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            {icon}
          </View>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {title}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 15,
            color: Colors.charcoal,
            lineHeight: 24,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          }}
        >
          {body}
        </Text>
      </View>
    </Animated.View>
  );
};

/* ── Main ──────────────────────────────────────── */

export default function WeeklyInsightsScreen({
  navigation,
}: {
  navigation: any;
}) {
  const { user } = useAuth();
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [savedToJournal, setSavedToJournal] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  // Cache key based on the current week (resets every Monday)
  function getWeekCacheKey(): string {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const d = String(monday.getDate()).padStart(2, "0");
    return `@weekly_insight_${user?.id}_${y}-${m}-${d}`;
  }

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadInsights();
  }, []);

  const loadInsights = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // 1. Check cache first
    try {
      const cacheKey = getWeekCacheKey();
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setInsight(parsed.insight);
        setEntryCount(parsed.entryCount);
        setFromCache(true);
        setLoading(false);
        return;
      }
    } catch {
      // Cache miss or error — continue to generate
    }

    // 2. Generate fresh
    await generateInsights();
  };

  const generateInsights = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setFromCache(false);
    setSavedToJournal(false);

    try {
      // Get entries from the past 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: entries } = await supabase
        .from("journal_entries")
        .select("body, mood, created_at")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: true });

      if (!entries || entries.length === 0) {
        setError(
          "No journal entries from the past week. Write a few reflections first, then come back for your insights."
        );
        setLoading(false);
        return;
      }

      setEntryCount(entries.length);

      // Decrypt entries on-device before sending to AI
      const decrypted = await Promise.all(
        entries.map(async (e) => {
          try {
            const dec = await decryptJournalEntry(e);
            return dec;
          } catch {
            return e;
          }
        })
      );

      const result = await fetchWeeklyInsights(decrypted);
      setInsight(result);

      // Save to cache
      try {
        const cacheKey = getWeekCacheKey();
        await AsyncStorage.setItem(
          cacheKey,
          JSON.stringify({ insight: result, entryCount: entries.length })
        );
      } catch {
        // Cache write failed — not critical
      }
    } catch (err: any) {
      console.error("Weekly insights error:", err);
      setError("Could not generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get date range for header
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const dateRange = `${weekAgo.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} — ${new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

  const handleSaveToJournal = async () => {
    if (!user || !insight || savedToJournal) return;

    try {
      const title = `Weekly Insights: ${dateRange}`;
      const body = [
        `📊 YOUR WEEK\n${insight.summary}`,
        `💜 MOOD & PATTERNS\n${insight.moodPattern}`,
        `📈 GROWTH\n${insight.growth}`,
        `📖 A VERSE FOR YOUR WEEK\n${insight.quranicReflection}\n— ${insight.quranicReference}`,
        `💡 FOR THE COMING WEEK\n${insight.suggestion}`,
        `🤲 A DU'A FOR YOU\n${insight.duaForWeek}`,
      ].join("\n\n");

      let saveTitle = title;
      let saveBody = body;
      try {
        const encrypted = await encryptJournalEntry({ title, body });
        saveTitle = encrypted.title || title;
        saveBody = encrypted.body;
      } catch {
        // Fallback to plaintext
      }

      const { error: dbError } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: saveTitle,
        body: saveBody,
        mood: null,
      });

      if (dbError) throw dbError;
      setSavedToJournal(true);
    } catch (err) {
      console.warn("Save insight error:", err);
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
            Journal
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
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerFade,
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "rgba(135,169,107,0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <TrendingUp size={24} color={Colors.sage} />
          </View>
          <Text
            style={{
              fontSize: 24,
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Weekly Insights
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: Colors.charcoalMuted,
            }}
          >
            {dateRange}
            {entryCount > 0 ? ` · ${entryCount} entries` : ""}
          </Text>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 18,
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

        {/* Loading */}
        {loading && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="large" color={Colors.sage} />
            <Text
              style={{
                color: Colors.charcoalMuted,
                fontSize: 14,
                marginTop: 16,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                fontStyle: "italic",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Reflecting on your week…
            </Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text
              style={{
                color: Colors.charcoalMuted,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 22,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                fontStyle: "italic",
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Insights */}
        {insight && !loading && (
          <>
            <InsightSection
              icon={<BarChart3 size={16} color={Colors.sage} />}
              title="Your Week"
              body={insight.summary}
              color={Colors.sage}
              delay={100}
            />

            <InsightSection
              icon={<Heart size={16} color="#9B7B8F" />}
              title="Mood & Patterns"
              body={insight.moodPattern}
              color="#9B7B8F"
              delay={250}
            />

            <InsightSection
              icon={<TrendingUp size={16} color="#7B8F6B" />}
              title="Growth"
              body={insight.growth}
              color="#7B8F6B"
              delay={400}
            />

            {/* Quranic reflection */}
            <Animated.View style={{ marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(135,169,107,0.08)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: "rgba(139,115,85,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <BookOpen size={16} color="#8B7355" />
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#8B7355",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    A Verse for Your Week
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(139,115,85,0.05)",
                    borderRadius: 12,
                    padding: 14,
                    borderLeftWidth: 3,
                    borderLeftColor: "rgba(139,115,85,0.3)",
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: Colors.charcoal,
                      fontStyle: "italic",
                      lineHeight: 22,
                      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                    }}
                  >
                    {insight.quranicReflection}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#8B7355",
                      fontWeight: "600",
                      marginTop: 8,
                    }}
                  >
                    — {insight.quranicReference}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <InsightSection
              icon={<Lightbulb size={16} color="#6B7F9B" />}
              title="For the Coming Week"
              body={insight.suggestion}
              color="#6B7F9B"
              delay={550}
            />

            <InsightSection
              icon={<HandHeart size={16} color="#9B7B8F" />}
              title="A Du'a for You"
              body={insight.duaForWeek}
              color="#9B7B8F"
              delay={700}
            />

            {/* Save + Regenerate */}
            <View
              style={{
                alignItems: "center",
                marginTop: 8,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: "rgba(135,169,107,0.1)",
                gap: 12,
              }}
            >
              {fromCache && (
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.charcoalMuted,
                    fontStyle: "italic",
                  }}
                >
                  Generated earlier this week
                </Text>
              )}

              {/* Save to journal */}
              <Pressable onPress={handleSaveToJournal}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    backgroundColor: savedToJournal
                      ? "rgba(135,169,107,0.08)"
                      : Colors.sage,
                    borderWidth: savedToJournal ? 1.5 : 0,
                    borderColor: Colors.sage,
                  }}
                >
                  <Bookmark
                    size={16}
                    color={savedToJournal ? Colors.sage : "white"}
                    fill={savedToJournal ? Colors.sage : "transparent"}
                  />
                  <Text
                    style={{
                      color: savedToJournal ? Colors.sage : "white",
                      fontSize: 14,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    {savedToJournal ? "Saved to Journal" : "Save to Journal"}
                  </Text>
                </View>
              </Pressable>

              {/* Regenerate */}
              <Pressable onPress={generateInsights}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: Colors.sage,
                  }}
                >
                  <RefreshCw size={15} color={Colors.sage} />
                  <Text
                    style={{
                      color: Colors.sage,
                      fontSize: 14,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    Generate fresh insights
                  </Text>
                </View>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}