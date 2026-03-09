// screens/DailyContentScreen.tsx
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
import {
  ChevronLeft,
  RefreshCw,
  BookMarked,
  BookOpen,
  Scroll,
  HandHeart,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../lib/theme";
import {
  fetchDailyContent,
  DailyHadith,
  DailyVerse,
  DailyStory,
  DailyDua,
} from "../lib/intelligence";
import { DailyContentType } from "./ExploreScreen";

/* ── Config per content type ───────────────────── */

const CONTENT_CONFIG: Record<
  DailyContentType,
  { title: string; icon: React.ReactNode; accentColor: string }
> = {
  hadith: {
    title: "Hadith of the Day",
    icon: <BookMarked size={20} color="#7B8F6B" />,
    accentColor: "#7B8F6B",
  },
  verse: {
    title: "Quranic Verse of the Day",
    icon: <BookOpen size={20} color="#8B7355" />,
    accentColor: "#8B7355",
  },
  story: {
    title: "Story of the Day",
    icon: <Scroll size={20} color="#6B7F9B" />,
    accentColor: "#6B7F9B",
  },
  dua: {
    title: "Du'a of the Day",
    icon: <HandHeart size={20} color="#9B7B8F" />,
    accentColor: "#9B7B8F",
  },
};

/* ── Helpers ───────────────────────────────────── */

function cacheKey(type: DailyContentType, dateStr: string): string {
  return `@daily_${type}_${dateStr}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00"); // noon to avoid timezone issues
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Section wrapper ───────────────────────────── */

const ContentSection = ({
  children,
  delay,
}: {
  children: React.ReactNode;
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
        marginBottom: 20,
      }}
    >
      {children}
    </Animated.View>
  );
};

/* ── Card wrapper ──────────────────────────────── */

const Card = ({ children }: { children: React.ReactNode }) => (
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
);

/* ── Label ─────────────────────────────────────── */

const SectionLabel = ({
  text,
  color,
}: {
  text: string;
  color?: string;
}) => (
  <Text
    style={{
      fontSize: 12,
      fontWeight: "700",
      color: color || Colors.sage,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 10,
    }}
  >
    {text}
  </Text>
);

/* ── Arabic block ──────────────────────────────── */

const ArabicText = ({ text }: { text: string }) => (
  <Text
    style={{
      fontSize: 22,
      color: Colors.charcoal,
      textAlign: "right",
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      lineHeight: 38,
      marginBottom: 12,
    }}
  >
    {text}
  </Text>
);

/* ── Body text ─────────────────────────────────── */

const BodyText = ({
  text,
  italic,
}: {
  text: string;
  italic?: boolean;
}) => (
  <Text
    style={{
      fontSize: 15,
      color: Colors.charcoal,
      lineHeight: 26,
      fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      fontStyle: italic ? "italic" : "normal",
    }}
  >
    {text}
  </Text>
);

/* ── Source tag ─────────────────────────────────── */

const SourceTag = ({ text }: { text: string }) => (
  <View
    style={{
      backgroundColor: "rgba(135,169,107,0.08)",
      borderRadius: 8,
      paddingVertical: 5,
      paddingHorizontal: 10,
      alignSelf: "flex-start",
      marginTop: 10,
    }}
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: Colors.sage,
      }}
    >
      {text}
    </Text>
  </View>
);

/* ══════════════════════════════════════════════════
   Content renderers for each type
   ══════════════════════════════════════════════════ */

const HadithContent = ({ data }: { data: DailyHadith }) => (
  <>
    <ContentSection delay={200}>
      <Card>
        <SectionLabel text="The Hadith" />
        <ArabicText text={data.arabic} />
        <View
          style={{
            height: 1,
            backgroundColor: "rgba(135,169,107,0.12)",
            marginVertical: 12,
          }}
        />
        <BodyText text={`"${data.english}"`} italic />
        <SourceTag text={data.source} />
      </Card>
    </ContentSection>

    <ContentSection delay={400}>
      <Card>
        <SectionLabel text="Explanation" />
        <BodyText text={data.explanation} />
      </Card>
    </ContentSection>

    <ContentSection delay={600}>
      <Card>
        <SectionLabel text="Applying This Today" />
        <BodyText text={data.application} />
      </Card>
    </ContentSection>
  </>
);

const VerseContent = ({ data }: { data: DailyVerse }) => (
  <>
    <ContentSection delay={200}>
      <Card>
        <SectionLabel text={data.theme} color="#8B7355" />
        {data.verses.map((v, i) => (
          <View
            key={i}
            style={{
              marginBottom: i < data.verses.length - 1 ? 20 : 0,
              borderLeftWidth: 3,
              borderLeftColor: "rgba(139,115,85,0.3)",
              paddingLeft: 14,
            }}
          >
            <ArabicText text={v.arabic} />
            <BodyText text={`"${v.translation}"`} italic />
            <SourceTag text={v.reference} />
          </View>
        ))}
      </Card>
    </ContentSection>

    <ContentSection delay={400}>
      <Card>
        <SectionLabel text="Explanation" color="#8B7355" />
        <BodyText text={data.explanation} />
      </Card>
    </ContentSection>
  </>
);

const StoryContent = ({ data }: { data: DailyStory }) => (
  <>
    <ContentSection delay={200}>
      <Card>
        <SectionLabel text={data.category} color="#6B7F9B" />
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: Colors.charcoal,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            marginBottom: 14,
          }}
        >
          {data.title}
        </Text>
        <BodyText text={data.narrative} />
        {data.source ? <SourceTag text={data.source} /> : null}
      </Card>
    </ContentSection>

    <ContentSection delay={400}>
      <Card>
        <SectionLabel text="The Lesson" color="#6B7F9B" />
        <BodyText text={data.lesson} />
      </Card>
    </ContentSection>

    <ContentSection delay={600}>
      <Card>
        <SectionLabel text="Applying This Today" color="#6B7F9B" />
        <BodyText text={data.application} />
      </Card>
    </ContentSection>
  </>
);

const DuaContent = ({ data }: { data: DailyDua }) => (
  <>
    <ContentSection delay={200}>
      <Card>
        <SectionLabel text="The Du'a" color="#9B7B8F" />
        <ArabicText text={data.arabic} />
        <View
          style={{
            backgroundColor: "rgba(155,123,143,0.06)",
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: Colors.charcoal,
              lineHeight: 24,
              fontStyle: "italic",
            }}
          >
            {data.transliteration}
          </Text>
        </View>
        <BodyText text={`"${data.translation}"`} italic />
        {data.source ? <SourceTag text={data.source} /> : null}
      </Card>
    </ContentSection>

    <ContentSection delay={400}>
      <Card>
        <SectionLabel text="Benefits of This Du'a" color="#9B7B8F" />
        <BodyText text={data.benefits} />
      </Card>
    </ContentSection>

    <ContentSection delay={600}>
      <Card>
        <SectionLabel text="When to Say It" color="#9B7B8F" />
        <BodyText text={data.bestTime} />
      </Card>
    </ContentSection>

    <ContentSection delay={800}>
      <Card>
        <SectionLabel text="Saying It with Sincerity" color="#9B7B8F" />
        <BodyText text={data.sincerity} />
      </Card>
    </ContentSection>
  </>
);

/* ══════════════════════════════════════════════════
   Main screen
   ══════════════════════════════════════════════════ */

export default function DailyContentScreen({
  route,
  navigation,
}: {
  route: { params: { type: DailyContentType; date?: string } };
  navigation: any;
}) {
  const { type, date } = route.params;
  const dateStr = date || getTodayStr();
  const isViewingToday = dateStr === getTodayStr();
  const config = CONTENT_CONFIG[type];

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    // Check cache
    const key = cacheKey(type, dateStr);
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        setContent(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Cache read error:", err);
    }

    // If viewing a past date with no cache, nothing to show
    if (!isViewingToday) {
      setLoading(false);
      setError("No reflection was saved for this day.");
      return;
    }

    // Fetch fresh for today
    await fetchFresh();
  };

  const fetchFresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyContent(type);
      const key = cacheKey(type, dateStr);
      await AsyncStorage.setItem(key, JSON.stringify(data));
      setContent(data);
    } catch (err: any) {
      console.error("Daily content error:", err);
      setError("Could not load today's content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    Alert.alert(
      "Get new content?",
      "This will replace today's content with a fresh selection.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Refresh", onPress: fetchFresh },
      ]
    );
  };

  const renderContent = () => {
    if (!content) return null;
    switch (type) {
      case "hadith":
        return <HadithContent data={content as DailyHadith} />;
      case "verse":
        return <VerseContent data={content as DailyVerse} />;
      case "story":
        return <StoryContent data={content as DailyStory} />;
      case "dua":
        return <DuaContent data={content as DailyDua} />;
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
          justifyContent: "space-between",
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
          <ChevronLeft size={22} color={config.accentColor} />
          <Text
            style={{
              color: config.accentColor,
              fontSize: 15,
              marginLeft: 2,
            }}
          >
            Garden
          </Text>
        </Pressable>

        {/* Only show refresh for today's content */}
        {content && !loading && isViewingToday && (
          <Pressable
            onPress={handleRefresh}
            hitSlop={12}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              padding: 4,
            })}
          >
            <RefreshCw size={18} color={Colors.charcoalMuted} />
          </Pressable>
        )}
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
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: `${config.accentColor}12`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            {config.icon}
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
            {config.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: Colors.charcoalMuted,
            }}
          >
            {formatDateDisplay(dateStr)}
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
                backgroundColor: `${config.accentColor}30`,
              }}
            />
            <View
              style={{
                width: 5,
                height: 5,
                backgroundColor: `${config.accentColor}50`,
                transform: [{ rotate: "45deg" }],
              }}
            />
            <View
              style={{
                width: 40,
                height: 1,
                backgroundColor: `${config.accentColor}30`,
              }}
            />
          </View>
        </Animated.View>

        {/* Loading */}
        {loading && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="large" color={config.accentColor} />
            <Text
              style={{
                color: Colors.charcoalMuted,
                fontSize: 14,
                marginTop: 16,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                fontStyle: "italic",
              }}
            >
              Preparing today's reflection…
            </Text>
          </View>
        )}

        {/* Error / empty past date */}
        {error && !loading && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text
              style={{
                color: Colors.charcoalMuted,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 16,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                fontStyle: "italic",
              }}
            >
              {error}
            </Text>
            {isViewingToday && (
              <Pressable
                onPress={fetchFresh}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: config.accentColor,
                }}
              >
                <RefreshCw size={16} color={config.accentColor} />
                <Text
                  style={{
                    color: config.accentColor,
                    fontSize: 14,
                    fontWeight: "600",
                    marginLeft: 8,
                  }}
                >
                  Try again
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Content */}
        {!loading && !error && renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}