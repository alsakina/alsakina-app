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
import { Search, X } from "lucide-react-native";
import { Colors } from "../lib/theme";
import { NAMES_OF_ALLAH, NameEntry } from "../lib/namesData";

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

/* ── Single name row ───────────────────────────── */

const NameRow = React.memo(
  ({
    item,
    index,
    onPress,
  }: {
    item: NameEntry;
    index: number;
    onPress: (item: NameEntry) => void;
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.min(index * 30, 600), // cap stagger so later items aren't invisible long
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
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "rgba(135,169,107,0.08)",
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
              {/* Rotated diamond background */}
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
              {/* Number text (not rotated) */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: Colors.sage,
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
                  color: Colors.sage,
                  marginBottom: 2,
                }}
              >
                {item.transliteration}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.charcoalMuted,
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
                color: Colors.charcoal,
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
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);

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
      <NameRow item={item} index={index} onPress={handlePress} />
    ),
    [handlePress]
  );

  const keyExtractor = useCallback(
    (item: NameEntry) => String(item.id),
    []
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      edges={["top"]}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
        <DiamondAccent />
        <Text
          style={{
            fontSize: 26,
            color: Colors.charcoal,
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
            color: Colors.charcoalMuted,
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
            backgroundColor: "white",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: Platform.OS === "ios" ? 10 : 4,
            borderWidth: 1,
            borderColor: "rgba(135,169,107,0.1)",
          }}
        >
          <Search size={18} color={Colors.charcoalMuted} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, meaning, or number…"
            placeholderTextColor={Colors.charcoalMuted}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: Colors.charcoal,
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
              <X size={18} color={Colors.charcoalMuted} />
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
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text
              style={{
                fontSize: 15,
                color: Colors.charcoalMuted,
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