// screens/LearnScreen.tsx
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Animated,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, Star } from "lucide-react-native";
import { useColors, LightColors } from "../lib/ThemeContext";
import { NAMES_OF_ALLAH, NameEntry } from "../lib/namesData";
import { NAME_DETAILS } from "../lib/nameDetailsData";
import ScreenHeader from "../components/ScreenHeader";

// Module-level colour ref — kept in sync by the screen on every render
let _C = LightColors;

/* ── Name of the Day helper ────────────────────── */

function getNameOfTheDay(): NameEntry {
  // Deterministic daily rotation through all 99 names
  // Same name for all users on the same day
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % 99;
  return NAMES_OF_ALLAH[index];
}

/* ── Decorative diamond accent ─────────────────── */

const DiamondAccent = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 10,
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

/* ── Name of the Day card ──────────────────────── */

const NameOfTheDayCard = ({
  name,
  onPress,
}: {
  name: NameEntry;
  onPress: () => void;
}) => {
  const detail = NAME_DETAILS[name.id];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginHorizontal: 20,
        marginBottom: 20,
      }}
    >
      <Pressable onPress={onPress}>
        <View
          style={{
            backgroundColor: _C.surface,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: _C.borderStrong,
            overflow: "hidden",
          }}
        >
          {/* Label bar */}
          <View
            style={{
              backgroundColor: _C.sageFaint,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              gap: 6,
            }}
          >
            <Star size={12} color={_C.sage} fill={_C.sage} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: _C.sage,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Name of the Day
            </Text>
            <Star size={12} color={_C.sage} fill={_C.sage} />
          </View>

          {/* Content */}
          <View style={{ padding: 22, alignItems: "center" }}>
            {/* Arabic */}
            <Text
              style={{
                fontSize: 36,
                color: _C.text,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                marginBottom: 6,
              }}
            >
              {name.arabic}
            </Text>

            {/* Transliteration */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: _C.sage,
                marginBottom: 2,
              }}
            >
              {name.transliteration}
            </Text>

            {/* Meaning */}
            <Text
              style={{
                fontSize: 14,
                color: _C.textMuted,
                marginBottom: 16,
              }}
            >
              {name.meaning}
            </Text>

            {/* Divider */}
            <View
              style={{
                width: 40,
                height: 1,
                backgroundColor: _C.borderStrong,
                marginBottom: 16,
              }}
            />

            {/* Overview preview */}
            {detail?.overview ? (
              <Text
                style={{
                  fontSize: 14,
                  color: _C.text,
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  lineHeight: 22,
                  textAlign: "center",
                  marginBottom: 12,
                }}
                numberOfLines={3}
              >
                {detail.overview}
              </Text>
            ) : null}

            {/* Quranic reference preview */}
            {detail?.quranicVerses?.[0] ? (
              <View
                style={{
                  backgroundColor: "rgba(135,169,107,0.05)",
                  borderRadius: 12,
                  padding: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: "rgba(135,169,107,0.3)",
                  alignSelf: "stretch",
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: _C.text,
                    fontStyle: "italic",
                    lineHeight: 20,
                    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  }}
                  numberOfLines={2}
                >
                  "{detail.quranicVerses[0].translation}"
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: _C.sage,
                    fontWeight: "600",
                    marginTop: 6,
                  }}
                >
                  — {detail.quranicVerses[0].reference}
                </Text>
              </View>
            ) : null}

            {/* Du'a preview */}
            {detail?.dua ? (
              <View
                style={{
                  backgroundColor: "rgba(155,123,143,0.05)",
                  borderRadius: 12,
                  padding: 12,
                  alignSelf: "stretch",
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#9B7B8F",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Related Du'a
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: _C.text,
                    fontStyle: "italic",
                    lineHeight: 20,
                    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  }}
                  numberOfLines={2}
                >
                  "{detail.dua.translation}"
                </Text>
                {detail.dua.source ? (
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#9B7B8F",
                      fontWeight: "600",
                      marginTop: 6,
                    }}
                  >
                    — {detail.dua.source}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* CTA */}
            <Text
              style={{
                fontSize: 13,
                color: _C.sage,
                fontWeight: "600",
              }}
            >
              Tap to explore in full →
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

/* ── Single name row ───────────────────────────── */

// Colors are passed as a prop so React.memo re-renders correctly
// when the theme changes, rather than reading stale module-level _C.
const NameRow = React.memo(
  ({
    item,
    index,
    colors,
    onPress,
  }: {
    item: NameEntry;
    index: number;
    colors: typeof LightColors;
    onPress: (item: NameEntry) => void;
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.min(index * 30, 600),
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          marginHorizontal: 20,
          marginBottom: 20,
          borderRadius: 20,
          paddingVertical: 20,
          paddingLeft: 20,
          paddingRight: 24,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.sageFaint,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <Pressable
          onPress={() => onPress(item)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Number badge (diamond) */}
            <View
              style={{
                width: 40,
                height: 40,
                marginRight: 14,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: colors.border,
                  transform: [{ rotate: "45deg" }],
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.sage,
                }}
              >
                {item.id}
              </Text>
            </View>

            {/* Transliteration + meaning */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: colors.sage,
                  marginBottom: 2,
                }}
              >
                {item.transliteration}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  lineHeight: 16,
                }}
              >
                {item.meaning}
              </Text>
            </View>

            {/* Arabic name on the right */}
            <Text
              style={{
                fontSize: 20,
                color: colors.text,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                marginLeft: 8,
                marginRight: 9,
              }}
            >
              {item.arabic}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

/* ── Main screen ───────────────────────────────── */

export default function LearnScreen({
  navigation,
}: {
  navigation: any;
}) {
  const C = useColors();
  _C = C;
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const nameOfDay = getNameOfTheDay();

  const filteredNames = searchQuery.trim()
    ? NAMES_OF_ALLAH.filter(
        (n) =>
          n.transliteration
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          n.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.arabic.includes(searchQuery) ||
          String(n.id) === searchQuery.trim()
      )
    : NAMES_OF_ALLAH;

  const handlePress = useCallback(
    (item: NameEntry) => {
      navigation.navigate("NameDetailScreen", {
        id: item.id,
        arabic: item.arabic,
        transliteration: item.transliteration,
        meaning: item.meaning,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: NameEntry; index: number }) => (
      <NameRow item={item} index={index} colors={C} onPress={handlePress} />
    ),
    [handlePress, C]
  );

  const keyExtractor = useCallback(
    (item: NameEntry) => String(item.id),
    []
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: _C.background }}
      edges={["top"]}
    >
      <ScreenHeader />

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 }}>
        <DiamondAccent />
        <Text
          style={{
            fontSize: 26,
            color: _C.text,
            textAlign: "center",
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            marginBottom: 4,
          }}
        >
          The 99 Names
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: _C.textMuted,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Asma ul-Husna
        </Text>

        {/* Search bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: _C.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: Platform.OS === "ios" ? 10 : 4,
            borderWidth: 1,
            borderColor: "rgba(135,169,107,0.1)",
          }}
        >
          <Search size={18} color={_C.textMuted} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, meaning, or number…"
            placeholderTextColor={_C.textMuted}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: _C.text,
              paddingVertical: 4,
            }}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery("");
                searchInputRef.current?.blur();
              }}
              hitSlop={8}
            >
              <X size={18} color={_C.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Names list */}
      <FlatList
        data={filteredNames}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListHeaderComponent={
          !searchQuery.trim() ? (
            <NameOfTheDayCard
              name={nameOfDay}
              onPress={() => handlePress(nameOfDay)}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text
              style={{
                fontSize: 15,
                color: _C.textMuted,
                textAlign: "center",
              }}
            >
              No names match your search.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}