// screens/ExploreScreen.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BookOpen,
  BookMarked,
  Scroll,
  HandHeart,
  Search,
  X,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";
import { usePremium } from "../lib/PremiumContext";
import { supabase } from "../lib/supabase";
import ScreenHeader from "../components/ScreenHeader";

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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

const CONTENT_LABELS: Record<string, string> = {
  hadith: "Hadith",
  verse: "Quranic Verse",
  story: "Story",
  dua: "Du'a",
};

const CONTENT_COLORS: Record<string, string> = {
  hadith: "#7B8F6B",
  verse: "#8B7355",
  story: "#6B7F9B",
  dua: "#9B7B8F",
};

interface SearchResult {
  id: number;
  date: string;
  type: string;
  content: any;
}

/* ── Search result card ────────────────────────── */

const SearchResultCard = ({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress: () => void;
}) => {
  const color = CONTENT_COLORS[result.type] || Colors.sage;
  const date = new Date(result.date + "T12:00:00");
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Get preview based on type
  const preview =
    result.type === "hadith"
      ? result.content.english?.slice(0, 100)
      : result.type === "verse"
      ? result.content.theme
      : result.type === "story"
      ? result.content.title
      : result.content.translation?.slice(0, 100);

  return (
    <View style={{ marginBottom: 10 }}>
      <Pressable onPress={onPress}>
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: "rgba(135,169,107,0.08)",
            borderLeftWidth: 3,
            borderLeftColor: color,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <View
              style={{
                backgroundColor: `${color}15`,
                borderRadius: 6,
                paddingVertical: 2,
                paddingHorizontal: 7,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color }}>
                {CONTENT_LABELS[result.type] || result.type}
              </Text>
            </View>
            <Text
              style={{ fontSize: 11, color: Colors.charcoalMuted }}
            >
              {dateStr}
            </Text>
          </View>
          {preview && (
            <Text
              style={{
                fontSize: 13,
                color: Colors.charcoal,
                lineHeight: 18,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              }}
              numberOfLines={2}
            >
              {preview}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
};

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
  const { user } = useAuth();
  const { isPremium } = usePremium();

  // Date state
  const recentDates = getRecentDates(isPremium ? 30 : 7);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cachedDays, setCachedDays] = useState<Record<string, Set<string>>>({});
  const [archivePage, setArchivePage] = useState(0); // for premium pagination
  const DATES_PER_PAGE = 7;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const selectedDateStr = getDateString(selectedDate);
  const isPast = !isToday(selectedDate);

  // Paginated dates for archive display
  // Build weeks as Sunday–Saturday
  function getWeekDates(pageOffset: number): Date[] {
    const today = new Date();
    // Find this week's Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay()); // getDay() 0=Sun

    // Go back by pageOffset weeks
    const weekStart = new Date(sunday);
    weekStart.setDate(sunday.getDate() - pageOffset * 7);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      // Don't show future dates
      if (d <= today) {
        dates.push(d);
      }
    }
    return dates;
  }

  const maxPages = isPremium ? 5 : 1; // premium: 5 weeks back, free: current week only
  const visibleDates = getWeekDates(archivePage);
  const totalPages = maxPages;

  useFocusEffect(
    useCallback(() => {
      checkCachedDates();
    }, [])
  );

  const checkCachedDates = async () => {
    try {
      // Cover the full range of dates we might show
      const today = new Date();
      const oldest = new Date(today);
      oldest.setDate(today.getDate() - (maxPages * 7 + 7)); // extra week buffer
      const oldestStr = getDateString(oldest);
      const newestStr = getDateString(today);

      const { data, error } = await supabase
        .from("daily_content")
        .select("date, type")
        .gte("date", oldestStr)
        .lte("date", newestStr);

      if (error) throw error;

      const dayMap: Record<string, Set<string>> = {};
      for (const row of data || []) {
        const dateStr = row.date;
        if (!dayMap[dateStr]) dayMap[dateStr] = new Set();
        dayMap[dateStr].add(row.type);
      }
      setCachedDays(dayMap);
    } catch (err) {
      console.warn("Supabase check error:", err);
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

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    setHasSearched(true);

    try {
      // Fetch recent content and filter locally
      // This is efficient since daily_content is small (~4 rows/day)
      const { data } = await supabase
        .from("daily_content")
        .select("id, date, type, content")
        .order("date", { ascending: false })
        .limit(400); // ~100 days of content

      if (!data) {
        setSearchResults([]);
        return;
      }

      const lowerQ = q.toLowerCase();
      const matches = data.filter((row) => {
        const contentStr = JSON.stringify(row.content).toLowerCase();
        return contentStr.includes(lowerQ);
      });

      // Free: 3 results, premium: all
      const limited = isPremium ? matches : matches.slice(0, 3);
      setSearchResults(limited);
    } catch (err) {
      console.warn("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchResultPress = (result: SearchResult) => {
    const root =
      navigation.getParent()?.getParent?.() ||
      navigation.getParent() ||
      navigation;
    root.navigate("DailyContentScreen", {
      type: result.type,
      date: result.date,
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    searchInputRef.current?.blur();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      edges={["top"]}
    >
      <ScreenHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 12,
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

        {/* ── Search ─────────────────────────────── */}
        <Animated.View
          style={{
            opacity: headerFade,
            marginTop: 28,
            paddingHorizontal: 20,
          }}
        >
          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
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
              Search
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(135,169,107,0.12)",
              }}
            />
          </View>

          {/* Search bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === "ios" ? 10 : 4,
              borderWidth: 1,
              borderColor: "rgba(135,169,107,0.1)",
              marginBottom: 12,
            }}
          >
            <Search size={18} color={Colors.charcoalMuted} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Search hadith, verses, stories, du'as…"
              placeholderTextColor={Colors.charcoalMuted}
              returnKeyType="search"
              autoCorrect={false}
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 15,
                color: Colors.charcoal,
                paddingVertical: 4,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={clearSearch} hitSlop={8}>
                <X size={18} color={Colors.charcoalMuted} />
              </Pressable>
            )}
          </View>

          {/* Search results */}
          {searching && (
            <Text
              style={{
                textAlign: "center",
                fontSize: 13,
                color: Colors.charcoalMuted,
                fontStyle: "italic",
                marginVertical: 12,
              }}
            >
              Searching…
            </Text>
          )}

          {hasSearched && !searching && searchResults.length === 0 && (
            <Text
              style={{
                textAlign: "center",
                fontSize: 13,
                color: Colors.charcoalMuted,
                fontStyle: "italic",
                marginVertical: 12,
              }}
            >
              No results found for "{searchQuery}"
            </Text>
          )}

          {searchResults.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              {searchResults.map((result) => (
                <SearchResultCard
                  key={`${result.type}-${result.date}`}
                  result={result}
                  onPress={() => handleSearchResultPress(result)}
                />
              ))}

              {/* Free user: show upgrade hint if results were limited */}
              {!isPremium && hasSearched && searchResults.length === 3 && (
                <Pressable
                  onPress={() => {
                    const root =
                      navigation.getParent()?.getParent?.() ||
                      navigation.getParent() ||
                      navigation;
                    root.navigate("Paywall");
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                      backgroundColor: "rgba(135,169,107,0.06)",
                      borderRadius: 12,
                      marginTop: 4,
                    }}
                  >
                    <Crown size={14} color={Colors.sage} />
                    <Text
                      style={{
                        fontSize: 13,
                        color: Colors.sage,
                        fontWeight: "600",
                        marginLeft: 6,
                      }}
                    >
                      Upgrade to see all results
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>

        {/* ── Past Reflections / Archive ────────── */}
        <Animated.View
          style={{
            opacity: headerFade,
            marginTop: 20,
            paddingHorizontal: 20,
          }}
        >
          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
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
              {isPremium ? "Archive" : "Past Reflections"}
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "rgba(135,169,107,0.12)",
              }}
            />
          </View>

          {/* Premium: page navigation */}
          {isPremium && totalPages > 1 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                gap: 16,
              }}
            >
              <Pressable
                onPress={() =>
                  setArchivePage(Math.min(totalPages - 1, archivePage + 1))
                }
                disabled={archivePage >= totalPages - 1}
                style={{
                  opacity: archivePage >= totalPages - 1 ? 0.3 : 1,
                  padding: 4,
                }}
              >
                <ChevronLeft size={20} color={Colors.sage} />
              </Pressable>

              <Text
                style={{
                  fontSize: 12,
                  color: Colors.charcoalMuted,
                  fontWeight: "600",
                }}
              >
                {/* Show date range for this page */}
                {visibleDates.length > 0
                  ? `${MONTH_NAMES[visibleDates[0].getMonth()]} ${visibleDates[0].getDate()} – ${MONTH_NAMES[visibleDates[visibleDates.length - 1].getMonth()]} ${visibleDates[visibleDates.length - 1].getDate()}`
                  : ""}
              </Text>

              <Pressable
                onPress={() => setArchivePage(Math.max(0, archivePage - 1))}
                disabled={archivePage === 0}
                style={{ opacity: archivePage === 0 ? 0.3 : 1, padding: 4 }}
              >
                <ChevronRight size={20} color={Colors.sage} />
              </Pressable>
            </View>
          )}

          {/* Date pills */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            {visibleDates.map((date) => {
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

          {/* Free user: archive upgrade hint */}
          {!isPremium && (
            <Pressable
              onPress={() => {
                const root =
                  navigation.getParent()?.getParent?.() ||
                  navigation.getParent() ||
                  navigation;
                root.navigate("Paywall");
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 16,
                  paddingVertical: 10,
                  backgroundColor: "rgba(135,169,107,0.06)",
                  borderRadius: 12,
                }}
              >
                <Crown size={14} color={Colors.sage} />
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.sage,
                    fontWeight: "600",
                    marginLeft: 6,
                  }}
                >
                  Unlock full archive with Premium
                </Text>
              </View>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}