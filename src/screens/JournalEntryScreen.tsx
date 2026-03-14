// screens/JournalEntryScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Check } from "lucide-react-native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { encryptJournalEntry, decryptJournalEntry } from "../lib/encryption";

const MOODS = [
  "Grateful",
  "Hopeful",
  "Peaceful",
  "Anxious",
  "Sad",
  "Confused",
  "Inspired",
  "Repentant",
];

export default function JournalEntryScreen({
  route,
  navigation,
}: {
  route: { params: { entryId?: number } };
  navigation: any;
}) {
  const { user } = useAuth();
  const entryId = route.params?.entryId;
  const isEditing = !!entryId;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) loadEntry();
  }, []);

  const loadEntry = async () => {
    try {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .single();

      if (data) {
        // Decrypt sensitive fields
        const decrypted = await decryptJournalEntry(data);
        setTitle(decrypted.title || "");
        setBody(decrypted.body || "");
        setMood(decrypted.mood);
      }
    } catch (err) {
      console.warn("Load entry error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!body.trim()) {
      Alert.alert("Empty reflection", "Write something before saving.");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      let saveTitle: string | null = title.trim() || null;
      let saveBody: string = body.trim();

      // Try to encrypt, fall back to plaintext if it fails
      try {
        const encrypted = await encryptJournalEntry({
          title: saveTitle,
          body: saveBody,
        });
        saveTitle = encrypted.title;
        saveBody = encrypted.body;
      } catch (encErr) {
        console.warn("Encryption failed, saving as plaintext:", encErr);
      }

      if (isEditing) {
        await supabase
          .from("journal_entries")
          .update({
            title: saveTitle,
            body: saveBody,
            mood,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entryId);
      } else {
        await supabase.from("journal_entries").insert({
          user_id: user.id,
          title: saveTitle,
          body: saveBody,
          mood,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: Colors.cream,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.sage} />
      </SafeAreaView>
    );
  }

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
          <ChevronLeft size={22} color={Colors.sage} />
          <Text style={{ color: Colors.sage, fontSize: 15, marginLeft: 2 }}>
            Journal
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Colors.sage,
            borderRadius: 10,
            paddingVertical: 8,
            paddingHorizontal: 14,
            opacity: saving ? 0.6 : pressed ? 0.8 : 1,
          })}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Check size={16} color="white" />
              <Text
                style={{
                  color: "white",
                  fontSize: 14,
                  fontWeight: "600",
                  marginLeft: 4,
                }}
              >
                Save
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date */}
          <Text
            style={{
              fontSize: 12,
              color: Colors.charcoalMuted,
              marginBottom: 16,
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>

          {/* Title */}
          <TextInput
            placeholder="Title (optional)"
            placeholderTextColor={Colors.charcoalMuted}
            value={title}
            onChangeText={setTitle}
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              marginBottom: 16,
              paddingVertical: 4,
            }}
          />

          {/* Mood selector */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: Colors.charcoalMuted,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            How are you feeling?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {MOODS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMood(mood === m ? null : m)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor:
                    mood === m
                      ? "rgba(135,169,107,0.2)"
                      : "white",
                  borderWidth: 1,
                  borderColor:
                    mood === m
                      ? Colors.sage
                      : "rgba(135,169,107,0.1)",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: mood === m ? Colors.sage : Colors.charcoalMuted,
                    fontWeight: mood === m ? "600" : "400",
                  }}
                >
                  {m}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Body */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(135,169,107,0.08)",
              minHeight: 240,
            }}
          >
            <TextInput
              placeholder="What's on your heart today..."
              placeholderTextColor={Colors.charcoalMuted}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              style={{
                fontSize: 15,
                color: Colors.charcoal,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                lineHeight: 26,
                minHeight: 200,
              }}
            />
          </View>

          <Text
            style={{
              textAlign: "right",
              fontSize: 12,
              color: Colors.charcoalMuted,
              marginTop: 8,
            }}
          >
            {body.length} characters
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}