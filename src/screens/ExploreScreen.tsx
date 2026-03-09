// screens/ExploreScreen.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen, BookMarked, Scroll, HandHeart } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../lib/theme";

/* ── Types ─────────────────────────────────────── */

export type DailyContentType = "hadith" | "verse" | "story" | "dua";

interface TileConfig {
  type: DailyContentType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
}

const TILES: TileConfig[] = [
  {
    type: "hadith",
    title: "Hadith of the Day",
    subtitle: "Wisdom from the Prophet ﷺ",
    icon: <BookMarked size={24} color="#7B8F6B" />,
    accentColor: "#7B8F6B",
    accentBg: "rgba(123,143,107,0.08)",
  },
  {
    type: "verse",
    title: "Quranic Verse",
    subtitle: "Words of Allah for today",
    icon: <BookOpen size={24} color="#8B7355" />,
    accentColor: "#8B7355",
    accentBg: "rgba(139,115,85,0.08)",
  },
  {
    type: "story",
    title: "Story of the Day",
    subtitle: "Lessons from the past",
    icon: <Scroll size={24} color="#6B7F9B" />,
    accentColor: "#6B7F9B",
    accentBg: "rgba(107,127,155,0.08)",
  },
  {
    type: "dua",
    title: "Du'a of the Day",
    subtitle: "A supplication for your heart",
    icon: <HandHeart size={24} color="#9B7B8F" />,
    accentColor: "#9B7B8F",
    accentBg: "rgba(155,123,143,0.08)",
  },
];

const CONTENT_TYPES: DailyContentType[] = ["hadith", "verse", "story", "dua"];

/* ── Date helpers ──────────────────────────────── */

function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getRecentDates(count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

function isToday(date: Date): boolean {
  return getDateString(date) === getDateString(new Date());
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* ── Diamond accent ────────────────────────────── */

const DiamondAccent = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 6,
    }}
  >
    {[5, 7, 5].map((size, i) => (
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

/* ── Single tile ───────────────────────────────── */

const GardenTile = ({
  config,
  index,
  onPress,
  isPast,
  hasContent,
}: {
  config: TileConfig;
  index: number;
  onPress: () => void;
  isPast: boolean;
  hasContent: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 150 + index * 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 150 + index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isDisabled = isPast && !hasContent;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        width: "48%",
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => ({
          backgroundColor: "white",
          borderRadius: 22,
          padding: 20,
          borderWidth: 1,
          borderColor: "rgba(135,169,107,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
          minHeight: 160,
          justifyContent: "space-between",
          opacity: isDisabled ? 0.35 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: config.accentBg,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginBottom: 16,
          }}
        >
          {config.icon}
        </View>

        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: Colors.charcoal,
              marginBottom: 4,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              textAlign: "center",
            }}
          >
            {config.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: Colors.charcoalMuted,
              lineHeight: 16,
              textAlign: "center",
            }}
          >
            {config.subtitle}
          </Text>
        </View>

        <View
          style={{
            height: 2,
            width: 24,
            backgroundColor: config.accentColor,
            borderRadius: 1,
            marginTop: 14,
            alignSelf: "center",
            opacity: 0.4,
          }}
        />
      </Pressable>
    </Animated.View>
  );
};

/* ── Date pill ─────────────────────────────────── */

const DatePill = ({
  date,
  isSelected,
  hasAnyContent,
  onPress,
}: {
  date: Date;
  isSelected: boolean;
  hasAnyContent: boolean;
  onPress: () => void;
}) => {
  const today = isToday(date);

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          paddingHorizontal: 4,
          borderRadius: 14,
          width: 46,
          backgroundColor: isSelected
            ? "rgba(135,169,107,0.3)"
            : "transparent",
          borderWidth: 1.5,
          borderColor: isSelected
            ? "rgba(135,169,107,0.5)"
            : "transparent",
        }}
      >
      {/* Day name */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: isSelected ? Colors.sage : Colors.charcoalMuted,
          letterSpacing: 0.3,
          marginBottom: 4,
          textAlign: "center",
          alignSelf: "center",
        }}
      >
        {today ? "Today" : DAY_NAMES[date.getDay()]}
      </Text>

      {/* Day number */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: isSelected ? "700" : "500",
          color: isSelected ? Colors.charcoal : Colors.charcoalMuted,
          fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          textAlign: "center",
          alignSelf: "center",
        }}
      >
        {date.getDate()}
      </Text>

      {/* Content indicator dot */}
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: hasAnyContent ? Colors.sage : "transparent",
          marginTop: 5,
          alignSelf: "center",
        }}
      />
      </View>
    </Pressable>
  );
};

/* ── Main screen ───────────────────────────────── */

export default function ExploreScreen({
  navigation,
}: {
  navigation: any;
}) {
  const headerFade = useRef(new Animated.Value(0)).current;
  const recentDates = getRecentDates(7);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cachedDays, setCachedDays] = useState<Record<string, Set<string>>>({});

  const selectedDateStr = getDateString(selectedDate);
  const isPast = !isToday(selectedDate);

  useFocusEffect(
    useCallback(() => {
      checkCachedDates();
    }, [])
  );

  const checkCachedDates = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dailyKeys = keys.filter((k) => k.startsWith("@daily_"));

      const dayMap: Record<string, Set<string>> = {};
      for (const key of dailyKeys) {
        const parts = key.split("_");
        if (parts.length >= 3) {
          const dateStr = parts.slice(2).join("_");
          const type = parts[1];
          if (!dayMap[dateStr]) dayMap[dateStr] = new Set();
          dayMap[dateStr].add(type);
        }
      }
      setCachedDays(dayMap);
    } catch (err) {
      console.warn("Cache check error:", err);
    }
  };

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTilePress = (type: DailyContentType) => {
    navigation.navigate("DailyContentScreen", {
      type,
      date: selectedDateStr,
    });
  };

  const hasContentForDate = (dateStr: string): boolean => {
    return !!cachedDays[dateStr] && cachedDays[dateStr].size > 0;
  };

  const hasTileContentForDate = (
    dateStr: string,
    type: DailyContentType
  ): boolean => {
    return !!cachedDays[dateStr]?.has(type);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      edges={["top"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 36,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerFade,
            alignItems: "center",
            marginBottom: 28,
            paddingHorizontal: 20,
          }}
        >
          <DiamondAccent />
          <Text
            style={{
              fontSize: 26,
              color: Colors.charcoal,
              textAlign: "center",
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              marginBottom: 6,
            }}
          >
            Your Garden
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Colors.charcoalMuted,
              textAlign: "center",
              lineHeight: 20,
              maxWidth: 260,
            }}
          >
            Daily nourishment for the soul.{"\n"}What will you tend to today?
          </Text>
        </Animated.View>

        {/* Tiles grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: 14,
            paddingHorizontal: 20,
          }}
        >
          {TILES.map((tile, i) => (
            <GardenTile
              key={tile.type}
              config={tile}
              index={i}
              onPress={() => handleTilePress(tile.type)}
              isPast={isPast}
              hasContent={hasTileContentForDate(selectedDateStr, tile.type)}
            />
          ))}
        </View>

        {/* Gentle footer */}
        <Animated.View
          style={{
            opacity: headerFade,
            marginTop: 36,
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: Colors.charcoalMuted,
              fontStyle: "italic",
              textAlign: "center",
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              lineHeight: 18,
              maxWidth: 240,
            }}
          >
            New content blooms each day.{"\n"}Return often and let your garden
            grow.
          </Text>
        </Animated.View>

        {/* ── Past Reflections ─────────────────── */}
        <Animated.View
          style={{
            opacity: headerFade,
            marginTop: 32,
            paddingHorizontal: 20,
          }}
        >
          {/* Thin divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              gap: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(135,169,107,0.12)",
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: Colors.charcoalMuted,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Past Reflections
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(135,169,107,0.12)",
              }}
            />
          </View>

          {/* Date pills — use a regular View with flexbox to spread evenly */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            {[...recentDates].reverse().map((date) => {
              const dateStr = getDateString(date);
              return (
                <DatePill
                  key={dateStr}
                  date={date}
                  isSelected={selectedDateStr === dateStr}
                  hasAnyContent={hasContentForDate(dateStr)}
                  onPress={() => setSelectedDate(date)}
                />
              );
            })}
          </View>

          {/* Viewing past date label */}
          {isPast && (
            <Text
              style={{
                textAlign: "center",
                fontSize: 12,
                color: Colors.charcoalMuted,
                fontStyle: "italic",
                marginTop: 10,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              }}
            >
              Viewing {MONTH_NAMES[selectedDate.getMonth()]}{" "}
              {selectedDate.getDate()} —{" "}
              {hasContentForDate(selectedDateStr)
                ? "tap a tile to revisit"
                : "no reflections saved"}
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}