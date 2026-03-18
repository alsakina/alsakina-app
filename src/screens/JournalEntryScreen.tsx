// screens/JournalEntryScreen.tsx
// ─────────────────────────────────────────────────
// Journal / diary entry screen.
// - Write freely or pick an AI-generated prompt
// - Prompts appear as a guiding question above your writing
// - Mood selector to track how you're feeling
// - Encrypted before saving to Supabase
// ─────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from "react";
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
import { ChevronLeft, Check, Sparkles, X } from "lucide-react-native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";
import { usePremium } from "../lib/PremiumContext";
import { supabase } from "../lib/supabase";
import { encryptJournalEntry, decryptJournalEntry } from "../lib/encryption";
import { fetchJournalPrompts, JournalPrompt } from "../lib/intelligence";

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
  const { isPremium } = usePremium();
  const entryId = route.params?.entryId;
  const isEditing = !!entryId;
  const bodyInputRef = useRef<TextInput>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // AI prompts (premium only, new entries only)
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) loadEntry();
    if (!isEditing && isPremium) loadPrompts();
  }, []);

  const loadPrompts = async () => {
    if (!user) return;
    setLoadingPrompts(true);
    try {
      const { data: recent } = await supabase
        .from("journal_entries")
        .select("body, mood, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      let decrypted: any[] = [];
      if (recent && recent.length > 0) {
        decrypted = await Promise.all(
          recent.map(async (e) => {
            try {
              return await decryptJournalEntry(e);
            } catch {
              return e;
            }
          })
        );
      }

      const result = await fetchJournalPrompts(decrypted);
      setPrompts(result);
    } catch (err) {
      console.warn("Prompts error:", err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const loadEntry = async () => {
    try {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .single();

      if (data) {
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

  const handleSelectPrompt = (prompt: JournalPrompt) => {
    setActivePrompt(prompt.prompt);
    setPrompts([]); // hide prompt cards
    // Focus the body input so user can start writing
    setTimeout(() => bodyInputRef.current?.focus(), 200);
  };

  const handleDismissPrompt = () => {
    setActivePrompt(null);
  };

  const handleSave = async () => {
    if (!body.trim()) {
      Alert.alert("Empty entry", "Write something before saving.");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      // Build the full entry text
      // If a prompt was used, prepend it so it's saved with context
      let saveBody = body.trim();
      let saveTitle = title.trim() || null;

      // Auto-generate title from first line if not set
      if (!saveTitle) {
        const firstLine = saveBody.split("\n")[0].slice(0, 60);
        saveTitle = firstLine + (firstLine.length >= 60 ? "…" : "");
      }

      // If there was an active prompt, include it in the saved body
      if (activePrompt) {
        saveBody = `Prompt: ${activePrompt}\n\n${saveBody}`;
      }

      // Encrypt
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
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ChevronLeft size={22} color={Colors.sage} />
            <Text style={{ color: Colors.sage, fontSize: 15, marginLeft: 2 }}>
              Journal
            </Text>
          </View>
        </Pressable>

        <Pressable onPress={handleSave} disabled={saving}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.sage,
              borderRadius: 10,
              paddingVertical: 8,
              paddingHorizontal: 14,
              opacity: saving ? 0.6 : 1,
            }}
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
          </View>
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
              marginBottom: 12,
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>

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
            style={{ marginBottom: 16 }}
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
                    mood === m ? "rgba(135,169,107,0.2)" : "white",
                  borderWidth: 1,
                  borderColor:
                    mood === m ? Colors.sage : "rgba(135,169,107,0.1)",
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

          {/* AI Prompt cards (premium, new entries only) */}
          {!isEditing &&
            !activePrompt &&
            isPremium &&
            (prompts.length > 0 || loadingPrompts) && (
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Sparkles size={14} color={Colors.sage} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: Colors.sage,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginLeft: 6,
                    }}
                  >
                    Writing Prompts
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.charcoalMuted,
                    fontStyle: "italic",
                    marginBottom: 10,
                    lineHeight: 18,
                  }}
                >
                  Tap a prompt for inspiration, or skip and write freely below.
                </Text>

                {loadingPrompts ? (
                  <View
                    style={{
                      backgroundColor: "white",
                      borderRadius: 14,
                      padding: 16,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "rgba(135,169,107,0.08)",
                    }}
                  >
                    <ActivityIndicator size="small" color={Colors.sage} />
                    <Text
                      style={{
                        fontSize: 12,
                        color: Colors.charcoalMuted,
                        marginTop: 8,
                        fontStyle: "italic",
                      }}
                    >
                      Preparing prompts for you…
                    </Text>
                  </View>
                ) : (
                  prompts.map((p, i) => (
                    <Pressable
                      key={i}
                      onPress={() => handleSelectPrompt(p)}
                    >
                      <View
                        style={{
                          backgroundColor: "white",
                          borderRadius: 14,
                          padding: 14,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: "rgba(135,169,107,0.1)",
                          borderLeftWidth: 3,
                          borderLeftColor: Colors.sage,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: Colors.charcoal,
                            fontFamily:
                              Platform.OS === "ios" ? "Georgia" : "serif",
                            lineHeight: 20,
                          }}
                        >
                          {p.prompt}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: Colors.charcoalMuted,
                            fontStyle: "italic",
                            marginTop: 6,
                          }}
                        >
                          {p.context}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            )}

          {/* Active prompt (selected as guiding question) */}
          {activePrompt && (
            <View
              style={{
                backgroundColor: "rgba(135,169,107,0.06)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                borderLeftWidth: 3,
                borderLeftColor: Colors.sage,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: Colors.sage,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Reflecting on
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: Colors.charcoal,
                      fontFamily:
                        Platform.OS === "ios" ? "Georgia" : "serif",
                      lineHeight: 22,
                      fontStyle: "italic",
                    }}
                  >
                    {activePrompt}
                  </Text>
                </View>
                <Pressable onPress={handleDismissPrompt} hitSlop={8}>
                  <X size={16} color={Colors.charcoalMuted} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Title (optional) */}
          <TextInput
            placeholder="Title (optional)"
            placeholderTextColor={Colors.charcoalMuted}
            value={title}
            onChangeText={setTitle}
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              marginBottom: 12,
              paddingVertical: 4,
            }}
          />

          {/* Writing area */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(135,169,107,0.08)",
              minHeight: 280,
            }}
          >
            <TextInput
              ref={bodyInputRef}
              placeholder={
                activePrompt
                  ? "Write your thoughts here…"
                  : "What's on your heart today…"
              }
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
                minHeight: 240,
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