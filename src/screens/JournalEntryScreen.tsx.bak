// screens/JournalEntryScreen.tsx
// ─────────────────────────────────────────────────
// New entries: mood + AI prompts + freeform writing
// Existing entries: static original content (read-only)
//   + editable notes section below
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
import { ChevronLeft, Check, Sparkles, X, PenLine } from "lucide-react-native";
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

const NOTES_SEPARATOR = "\n\n───── My Notes ─────\n\n";

/* ── Parse saved content into original + notes ──── */

function splitContent(body: string): { original: string; notes: string } {
  const idx = body.indexOf(NOTES_SEPARATOR);
  if (idx === -1) {
    // Check for a simpler separator for legacy entries
    const legacyIdx = body.indexOf("\n\n---NOTES---\n\n");
    if (legacyIdx === -1) {
      return { original: body, notes: "" };
    }
    return {
      original: body.slice(0, legacyIdx),
      notes: body.slice(legacyIdx + "\n\n---NOTES---\n\n".length),
    };
  }
  return {
    original: body.slice(0, idx),
    notes: body.slice(idx + NOTES_SEPARATOR.length),
  };
}

function combineContent(original: string, notes: string): string {
  if (!notes.trim()) return original;
  return original + NOTES_SEPARATOR + notes.trim();
}

/* ── Format original content for display ────────── */

function renderFormattedContent(text: string) {
  const sections = text.split("\n\n");

  // Color mapping for weekly insight section icons
  const sectionColors: Record<string, string> = {
    "YOUR WEEK": "#87A96B",
    "MOOD & PATTERNS": "#9B7B8F",
    "GROWTH": "#7B8F6B",
    "A VERSE FOR YOUR WEEK": "#8B7355",
    "FOR THE COMING WEEK": "#6B7F9B",
    "A DU'A FOR YOU": "#9B7B8F",
  };

  return sections.map((section, i) => {
    const trimmed = section.trim();
    if (!trimmed) return null;

    // Weekly insight section: emoji + CAPS HEADER on first line, body below
    // Match patterns like "📊 YOUR WEEK\nbody text..."
    const insightMatch = trimmed.match(
      /^(.{1,4})\s+([A-Z][A-Z &'']+)\n([\s\S]+)/
    );
    if (insightMatch) {
      const emoji = insightMatch[1];
      const header = insightMatch[2].trim();
      let body = insightMatch[3].trim();
      const color = sectionColors[header] || Colors.sage;

      // Check if body contains a Quranic reference (— Surah...)
      let reference: string | null = null;
      const refMatch = body.match(/\n—\s*(.+)$/);
      if (refMatch) {
        reference = refMatch[1];
        body = body.slice(0, refMatch.index).trim();
      }

      const isVerse = header.includes("VERSE");
      const isDua = header.includes("DU'A") || header.includes("DUA");

      return (
        <View
          key={i}
          style={{
            backgroundColor: "white",
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "rgba(135,169,107,0.08)",
          }}
        >
          {/* Section header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                backgroundColor: `${color}15`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Text style={{ fontSize: 14 }}>{emoji}</Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {header}
            </Text>
          </View>

          {/* Body */}
          {isVerse ? (
            <View
              style={{
                backgroundColor: "rgba(139,115,85,0.05)",
                borderRadius: 12,
                padding: 14,
                borderLeftWidth: 3,
                borderLeftColor: "rgba(139,115,85,0.3)",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.charcoal,
                  fontStyle: "italic",
                  lineHeight: 22,
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                }}
              >
                {body}
              </Text>
              {reference && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#8B7355",
                    fontWeight: "600",
                    marginTop: 8,
                  }}
                >
                  — {reference}
                </Text>
              )}
            </View>
          ) : isDua ? (
            <Text
              style={{
                fontSize: 14,
                color: Colors.charcoal,
                lineHeight: 24,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                fontStyle: "italic",
              }}
            >
              {body}
            </Text>
          ) : (
            <Text
              style={{
                fontSize: 14,
                color: Colors.charcoal,
                lineHeight: 24,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              }}
            >
              {body}
            </Text>
          )}
        </View>
      );
    }

    // Standalone header line (emoji + CAPS, no body below)
    const headerMatch = trimmed.match(/^(.{1,4})\s+([A-Z][A-Z &'']+)$/);
    if (headerMatch) {
      return (
        <View key={i} style={{ marginTop: i > 0 ? 20 : 0, marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: Colors.sage,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {trimmed}
          </Text>
        </View>
      );
    }

    // Sanctuary reflection prompt
    if (trimmed.startsWith('My reflection:')) {
      return (
        <View
          key={i}
          style={{
            backgroundColor: "rgba(135,169,107,0.06)",
            borderRadius: 14,
            padding: 14,
            borderLeftWidth: 3,
            borderLeftColor: "rgba(135,169,107,0.3)",
            marginBottom: 12,
          }}
        >
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
            Your reflection
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              lineHeight: 22,
              fontStyle: "italic",
            }}
          >
            {trimmed.replace('My reflection: ', '')}
          </Text>
        </View>
      );
    }

    // Check if it's a Name of Allah entry (Arabic — Transliteration)
    const nameMatch = trimmed.match(/^(.+)\s—\s(.+)\s\((.+)\)\n(.+)/s);
    if (nameMatch) {
      return (
        <View
          key={i}
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "rgba(135,169,107,0.08)",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 24,
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              marginBottom: 4,
            }}
          >
            {nameMatch[1]}
          </Text>
          <Text
            style={{
              textAlign: "center",
              fontSize: 15,
              fontWeight: "600",
              color: Colors.sage,
            }}
          >
            {nameMatch[2]}
          </Text>
          <Text
            style={{
              textAlign: "center",
              fontSize: 13,
              color: Colors.charcoalMuted,
              marginBottom: 12,
            }}
          >
            {nameMatch[3]}
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: "rgba(135,169,107,0.15)",
              marginBottom: 10,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              lineHeight: 22,
            }}
          >
            {nameMatch[4]}
          </Text>
        </View>
      );
    }

    // Check if it's a Quranic reference line (starts with —)
    if (trimmed.startsWith("—")) {
      return (
        <Text
          key={i}
          style={{
            fontSize: 12,
            color: "#8B7355",
            fontWeight: "600",
            marginTop: -8,
            marginBottom: 12,
          }}
        >
          {trimmed}
        </Text>
      );
    }

    // Check for "Prompt:" prefix
    if (trimmed.startsWith("Prompt:")) {
      return (
        <View
          key={i}
          style={{
            backgroundColor: "rgba(135,169,107,0.06)",
            borderRadius: 14,
            padding: 14,
            borderLeftWidth: 3,
            borderLeftColor: "rgba(135,169,107,0.3)",
            marginBottom: 12,
          }}
        >
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
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              lineHeight: 22,
              fontStyle: "italic",
            }}
          >
            {trimmed.replace("Prompt: ", "")}
          </Text>
        </View>
      );
    }

    // Default: regular paragraph
    return (
      <Text
        key={i}
        style={{
          fontSize: 14,
          color: Colors.charcoal,
          fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          lineHeight: 24,
          marginBottom: 10,
        }}
      >
        {trimmed}
      </Text>
    );
  });
}

/* ── Main screen ───────────────────────────────── */

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
  const notesInputRef = useRef<TextInput>(null);

  // New entry state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Existing entry: separated original + notes
  const [originalContent, setOriginalContent] = useState("");
  const [notes, setNotes] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // AI prompts
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
        setMood(decrypted.mood);
        setCreatedAt(decrypted.created_at);

        // Split into original content + notes
        const { original, notes: existingNotes } = splitContent(
          decrypted.body || ""
        );
        setOriginalContent(original);
        setNotes(existingNotes);
        setBody(decrypted.body || "");
      }
    } catch (err) {
      console.warn("Load entry error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: JournalPrompt) => {
    setActivePrompt(prompt.prompt);
    setPrompts([]);
    setTimeout(() => bodyInputRef.current?.focus(), 200);
  };

  const handleDismissPrompt = () => {
    setActivePrompt(null);
  };

  const handleSave = async () => {
    if (!user) return;

    if (isEditing) {
      // Save notes alongside original content
      const fullBody = combineContent(originalContent, notes);

      setSaving(true);
      try {
        let saveTitle: string | null = title.trim() || null;
        let saveBody = fullBody;

        try {
          const encrypted = await encryptJournalEntry({
            title: saveTitle,
            body: saveBody,
          });
          saveTitle = encrypted.title;
          saveBody = encrypted.body;
        } catch {
          // Fallback plaintext
        }

        await supabase
          .from("journal_entries")
          .update({
            title: saveTitle,
            body: saveBody,
            mood,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entryId);

        navigation.goBack();
      } catch {
        Alert.alert("Error", "Could not save. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      // New entry
      if (!body.trim()) {
        Alert.alert("Empty entry", "Write something before saving.");
        return;
      }

      setSaving(true);
      try {
        let saveBody = body.trim();
        let saveTitle = title.trim() || null;

        if (!saveTitle) {
          const firstLine = saveBody.split("\n")[0].slice(0, 60);
          saveTitle = firstLine + (firstLine.length >= 60 ? "…" : "");
        }

        if (activePrompt) {
          saveBody = `Prompt: ${activePrompt}\n\n${saveBody}`;
        }

        try {
          const encrypted = await encryptJournalEntry({
            title: saveTitle,
            body: saveBody,
          });
          saveTitle = encrypted.title;
          saveBody = encrypted.body;
        } catch {
          // Fallback plaintext
        }

        await supabase.from("journal_entries").insert({
          user_id: user.id,
          title: saveTitle,
          body: saveBody,
          mood,
        });

        navigation.goBack();
      } catch {
        Alert.alert("Error", "Could not save. Please try again.");
      } finally {
        setSaving(false);
      }
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

  /* ── Editing existing entry ─────────────────── */

  if (isEditing) {
    const dateStr = createdAt
      ? new Date(createdAt).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";

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
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ChevronLeft size={22} color={Colors.sage} />
              <Text
                style={{ color: Colors.sage, fontSize: 15, marginLeft: 2 }}
              >
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
                marginBottom: 8,
              }}
            >
              {dateStr}
            </Text>

            {/* Title */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: Colors.charcoal,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                marginBottom: 4,
              }}
            >
              {title}
            </Text>

            {/* Mood */}
            {mood && (
              <View
                style={{
                  backgroundColor: "rgba(135,169,107,0.1)",
                  borderRadius: 10,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  alignSelf: "flex-start",
                  marginBottom: 16,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.sage,
                    fontWeight: "600",
                  }}
                >
                  {mood}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "rgba(135,169,107,0.12)",
                marginBottom: 16,
              }}
            />

            {/* Original content — static, formatted */}
            <View style={{ marginBottom: 24 }}>
              {renderFormattedContent(originalContent)}
            </View>

            {/* Notes section */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "rgba(135,169,107,0.12)",
                paddingTop: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <PenLine size={14} color={Colors.sage} />
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
                  My Notes
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(135,169,107,0.08)",
                  minHeight: 120,
                }}
              >
                <TextInput
                  ref={notesInputRef}
                  placeholder="Add your personal notes, thoughts, or follow-ups…"
                  placeholderTextColor={Colors.charcoalMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                  style={{
                    fontSize: 15,
                    color: Colors.charcoal,
                    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                    lineHeight: 24,
                    minHeight: 100,
                  }}
                />
              </View>

              <Text
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  color: Colors.charcoalMuted,
                  marginTop: 6,
                }}
              >
                {notes.length} characters
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  /* ── New entry ──────────────────────────────── */

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
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
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

          {/* AI Prompt cards */}
          {!activePrompt &&
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
                  Tap a prompt for inspiration, or skip and write freely
                  below.
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

          {/* Active prompt */}
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

          {/* Title */}
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