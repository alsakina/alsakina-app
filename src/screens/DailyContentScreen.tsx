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
  Bookmark,
  BookMarked,
  BookOpen,
  Scroll,
  HandHeart,
} from "lucide-react-native";
import { useColors, LightColors } from "../lib/ThemeContext";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import {
  fetchDailyContent,
  DailyHadith,
  DailyVerse,
  DailyStory,
  DailyDua,
} from "../lib/intelligence";
import { DailyContentType } from "./ExploreScreen";

// Module-level colour ref — kept in sync by the screen on every render
let _C = LightColors;

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

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
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
      backgroundColor: _C.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: _C.sageFaint,
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
      color: color || _C.sage,
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
      color: _C.text,
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
      color: _C.text,
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
      backgroundColor: _C.sageFaint,
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
        color: _C.sage,
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
            backgroundColor: _C.border,
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
            color: _C.text,
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
              color: _C.text,
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
  const C = useColors();
  _C = C;
  const { type, date } = route.params;
  const dateStr = date || getTodayStr();
  const isViewingToday = dateStr === getTodayStr();
  const config = CONTENT_CONFIG[type];

  const { user } = useAuth();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadContent();
    checkBookmark();
  }, []);

  const checkBookmark = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("saved_content")
        .select("id")
        .eq("user_id", user.id)
        .eq("content_type", type)
        .eq("content_date", dateStr)
        .single();
      setBookmarked(!!data);
    } catch {
      setBookmarked(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      navigation.getParent()?.navigate("Auth") ?? navigation.navigate("Auth");
      return;
    }
    if (!content) return;

    try {
      if (bookmarked) {
        await supabase
          .from("saved_content")
          .delete()
          .eq("user_id", user.id)
          .eq("content_type", type)
          .eq("content_date", dateStr);
        setBookmarked(false);
      } else {
        await supabase.from("saved_content").insert({
          user_id: user.id,
          content_type: type,
          content_date: dateStr,
          content,
        });
        setBookmarked(true);
      }
    } catch (err: any) {
      if (err?.code === "23505") {
        setBookmarked(true);
      } else {
        console.warn("Bookmark error:", err);
      }
    }
  };

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyContent(type, dateStr);
      setContent(data);
    } catch (err: any) {
      console.error("Daily content error:", err);
      setError(
        isViewingToday
          ? "Could not load today's content. Please try again."
          : "No reflection was saved for this day."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    Alert.alert(
      "Get new content?",
      "This will load fresh content for today.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Refresh", onPress: loadContent },
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
      style={{ flex: 1, backgroundColor: _C.background }}
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
        {/* FIX: View inside Pressable guarantees row layout */}
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
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
          </View>
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
            <RefreshCw size={18} color={_C.textMuted} />
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
              color: _C.text,
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
              color: _C.textMuted,
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
                color: _C.textMuted,
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
                color: _C.textMuted,
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
                onPress={loadContent}
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

        {/* Bookmark button */}
        {!loading && !error && content && (
          <View
            style={{
              alignItems: "center",
              marginTop: 8,
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: "rgba(135,169,107,0.1)",
            }}
          >
            <Pressable onPress={handleBookmark}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: bookmarked ? _C.sage : config.accentColor,
                  backgroundColor: bookmarked ? _C.sageFaint : "transparent",
                }}
              >
                <Bookmark
                  size={16}
                  color={bookmarked ? _C.sage : config.accentColor}
                  fill={bookmarked ? _C.sage : "transparent"}
                />
                <Text
                  style={{
                    color: bookmarked ? _C.sage : config.accentColor,
                    fontSize: 14,
                    fontWeight: "600",
                    marginLeft: 8,
                  }}
                >
                  {bookmarked ? "Saved — tap to remove" : "Save to Journal"}
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}