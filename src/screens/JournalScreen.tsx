// screens/JournalScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  BookMarked,
  NotebookPen,
  Settings,
  Trash2,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { decryptJournalEntry } from "../lib/encryption";

/* ── Types ─────────────────────────────────────── */

type TabType = "entries" | "saved";

interface JournalEntry {
  id: number;
  title: string | null;
  body: string;
  mood: string | null;
  created_at: string;
}

interface SavedItem {
  id: number;
  content_type: string;
  content_date: string;
  content: any;
  saved_at: string;
}

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

/* ── Tab toggle ────────────────────────────────── */

const TabToggle = ({
  active,
  onSwitch,
}: {
  active: TabType;
  onSwitch: (tab: TabType) => void;
}) => (
  <View
    style={{
      flexDirection: "row",
      backgroundColor: "rgba(135,169,107,0.08)",
      borderRadius: 12,
      padding: 3,
      marginBottom: 20,
    }}
  >
    {(["entries", "saved"] as TabType[]).map((tab) => (
      <Pressable
        key={tab}
        onPress={() => onSwitch(tab)}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor:
            active === tab ? "white" : "transparent",
          shadowColor: active === tab ? "#000" : "transparent",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: active === tab ? 0.06 : 0,
          shadowRadius: 3,
          elevation: active === tab ? 1 : 0,
        }}
      >
        {tab === "entries" ? (
          <NotebookPen
            size={15}
            color={active === tab ? Colors.sage : Colors.charcoalMuted}
          />
        ) : (
          <BookMarked
            size={15}
            color={active === tab ? Colors.sage : Colors.charcoalMuted}
          />
        )}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: active === tab ? Colors.sage : Colors.charcoalMuted,
            marginLeft: 6,
          }}
        >
          {tab === "entries" ? "Reflections" : "Saved"}
        </Text>
      </Pressable>
    ))}
  </View>
);

/* ── Journal entry row ─────────────────────────── */

const EntryRow = ({
  entry,
  onPress,
  onDelete,
}: {
  entry: JournalEntry;
  onPress: () => void;
  onDelete: () => void;
}) => {
  const date = new Date(entry.created_at);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => {
        Alert.alert("Delete entry?", "This cannot be undone.", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
      }}
      style={({ pressed }) => ({
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(135,169,107,0.08)",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: Colors.charcoal,
            flex: 1,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          }}
          numberOfLines={1}
        >
          {entry.title || "Untitled Reflection"}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: Colors.charcoalMuted,
            marginLeft: 12,
          }}
        >
          {dateStr}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 13,
          color: Colors.charcoalMuted,
          lineHeight: 18,
        }}
        numberOfLines={2}
      >
        {entry.body}
      </Text>
      {entry.mood && (
        <View
          style={{
            backgroundColor: "rgba(135,169,107,0.08)",
            borderRadius: 8,
            paddingVertical: 3,
            paddingHorizontal: 8,
            alignSelf: "flex-start",
            marginTop: 8,
          }}
        >
          <Text
            style={{ fontSize: 11, color: Colors.sage, fontWeight: "600" }}
          >
            {entry.mood}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

/* ── Saved content row ─────────────────────────── */

const CONTENT_LABELS: Record<string, string> = {
  hadith: "Hadith",
  verse: "Quranic Verse",
  story: "Story",
  dua: "Du'a",
};

const SavedRow = ({
  item,
  onPress,
  onRemove,
}: {
  item: SavedItem;
  onPress: () => void;
  onRemove: () => void;
}) => {
  const date = new Date(item.content_date + "T12:00:00");
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Get a preview text based on content type
  const preview =
    item.content_type === "hadith"
      ? item.content.english?.slice(0, 80)
      : item.content_type === "verse"
      ? item.content.theme
      : item.content_type === "story"
      ? item.content.title
      : item.content.translation?.slice(0, 80);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => {
        Alert.alert("Remove bookmark?", "", [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: onRemove },
        ]);
      }}
      style={({ pressed }) => ({
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(135,169,107,0.08)",
        opacity: pressed ? 0.85 : 1,
      })}
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
            backgroundColor: "rgba(135,169,107,0.08)",
            borderRadius: 8,
            paddingVertical: 3,
            paddingHorizontal: 8,
          }}
        >
          <Text
            style={{ fontSize: 11, color: Colors.sage, fontWeight: "600" }}
          >
            {CONTENT_LABELS[item.content_type] || item.content_type}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: Colors.charcoalMuted }}>
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
    </Pressable>
  );
};

/* ── Main screen ───────────────────────────────── */

export default function JournalScreen({
  navigation,
}: {
  navigation: any;
}) {
  const { user } = useAuth();
  const headerFade = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<TabType>("entries");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Reload data when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user) loadData();
    }, [user, activeTab])
  );

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === "entries") {
        const { data } = await supabase
          .from("journal_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        // Decrypt entries on-device
        if (data && data.length > 0) {
          const decrypted = await Promise.all(
            data.map((entry) => decryptJournalEntry(entry))
          );
          setEntries(decrypted);
        } else {
          setEntries([]);
        }
      } else {
        const { data } = await supabase
          .from("saved_content")
          .select("*")
          .eq("user_id", user.id)
          .order("saved_at", { ascending: false })
          .limit(50);
        setSavedItems(data || []);
      }
    } catch (err) {
      console.warn("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: number) => {
    await supabase.from("journal_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const removeSaved = async (id: number) => {
    await supabase.from("saved_content").delete().eq("id", id);
    setSavedItems((prev) => prev.filter((s) => s.id !== id));
  };

  // If not signed in, show prompt
  if (!user) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.cream }}
        edges={["top"]}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <DiamondAccent />
          <Text
            style={{
              fontSize: 22,
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              textAlign: "center",
              marginBottom: 10,
              marginTop: 8,
            }}
          >
            Your Journal
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Colors.charcoalMuted,
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 24,
            }}
          >
            Sign in to save your reflections, bookmark content, and track your
            spiritual journey.
          </Text>
          <Pressable
            onPress={() => navigation.getParent()?.navigate("Auth") ?? navigation.navigate("Auth")}
          >
            <View
              style={{
                backgroundColor: Colors.sage,
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 40,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "700", textAlign: "center" }}
              >
                Sign In or Create Account
              </Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      edges={["top"]}
    >
      {/* Header */}
      <Animated.View
        style={{
          opacity: headerFade,
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View>
            <DiamondAccent />
            <Text
              style={{
                fontSize: 24,
                color: Colors.charcoal,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              }}
            >
              Your Journal
            </Text>
          </View>
          <Pressable
            onPress={() => {
              const root = navigation.getParent()?.getParent?.() || navigation.getParent() || navigation;
              root.navigate("SettingsScreen");
            }}
            hitSlop={12}
            style={{ padding: 4 }}
          >
            <Settings size={20} color={Colors.charcoalMuted} />
          </Pressable>
        </View>

        <TabToggle active={activeTab} onSwitch={setActiveTab} />
      </Animated.View>

      {/* Content */}
      {activeTab === "entries" ? (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
          renderItem={({ item }) => (
            <EntryRow
              entry={item}
              onPress={() =>
                navigation.navigate("JournalEntryScreen", {
                  entryId: item.id,
                })
              }
              onDelete={() => deleteEntry(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.charcoalMuted,
                  textAlign: "center",
                  fontStyle: "italic",
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  lineHeight: 22,
                }}
              >
                No reflections yet.{"\n"}Tap + to write your first one.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={savedItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
          renderItem={({ item }) => (
            <SavedRow
              item={item}
              onPress={() => {
                // Navigate via root navigator (2 levels up: JournalStack → Tab → Root)
                const root = navigation.getParent()?.getParent?.() || navigation.getParent();
                root?.navigate("DailyContentScreen", {
                  type: item.content_type,
                  date: item.content_date,
                });
              }}
              onRemove={() => removeSaved(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.charcoalMuted,
                  textAlign: "center",
                  fontStyle: "italic",
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  lineHeight: 22,
                }}
              >
                No saved content yet.{"\n"}Bookmark your favorite hadith,
                du'a, and more from the Garden.
              </Text>
            </View>
          }
        />
      )}

      {/* FAB for new entry */}
      {activeTab === "entries" && (
        <Pressable
          onPress={() => navigation.navigate("JournalEntryScreen", {})}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: Colors.sage,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Plus size={24} color="white" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}