// screens/ExploreScreen.tsx
import React, { useRef, useEffect } from "react";
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
}: {
  config: TileConfig;
  index: number;
  onPress: () => void;
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
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        {/* Icon container */}
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

        {/* Text */}
        <View>
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

        {/* Bottom accent line */}
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

/* ── Main screen ───────────────────────────────── */

export default function ExploreScreen({
  navigation,
}: {
  navigation: any;
}) {
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTilePress = (type: DailyContentType) => {
    navigation.navigate("DailyContentScreen", { type });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      edges={["top"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
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
            marginBottom: 36,
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
          }}
        >
          {TILES.map((tile, i) => (
            <GardenTile
              key={tile.type}
              config={tile}
              index={i}
              onPress={() => handleTilePress(tile.type)}
            />
          ))}
        </View>

        {/* Gentle footer */}
        <Animated.View
          style={{ opacity: headerFade, marginTop: 36, alignItems: "center" }}
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
            New content blooms each day.{"\n"}Return often and let your garden grow.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}