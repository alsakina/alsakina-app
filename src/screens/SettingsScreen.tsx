// screens/SettingsScreen.tsx
// ─────────────────────────────────────────────────
// Full-featured settings screen for Al-Sakina.
// Sections:
//   1. Profile (avatar, display name, email)
//   2. Subscription (premium status / upgrade)
//   3. Appearance (dark mode toggle)
//   4. Notifications (daily reminder toggle + time picker)
//   5. Privacy & Security (change password)
//   6. Data & Storage (export journal, clear cache)
//   7. Support (rate app, send feedback, help center)
//   8. Legal (privacy policy, terms)
//   9. Account (change email, delete account, sign out)
// ─────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  Linking,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Shield,
  LogOut,
  Crown,
  Moon,
  Bell,
  Clock,
  Download,
  Trash2,
  Star,
  MessageSquare,
  HelpCircle,
  FileText,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react-native";
import { useColors, LightColors } from "../lib/ThemeContext";
import { useTheme } from "../lib/ThemeContext";
import { useAuth } from "../lib/AuthContext";
import { usePremium, FREE_REFLECTIONS_PER_MONTH } from "../lib/PremiumContext";
import { supabase } from "../lib/supabase";
import { decryptJournalEntry } from "../lib/encryption";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  scheduleDailyReminder,
  cancelDailyReminder,
} from "../lib/notifications";

// Module-level colour ref — kept in sync by the screen on every render
let _C = LightColors;

/* ── Constants ─────────────────────────────────────────────────────────────
 * TODO: Fill in all values below before shipping.
 * ─────────────────────────────────────────────────────────────────────────── */

const APP_STORE_URL   = "https://apps.apple.com/app/id000000000";                               // TODO
const PLAY_STORE_URL  = "https://play.google.com/store/apps/details?id=com.yourcompany.alsakina"; // TODO
const HELP_CENTER_URL = "https://yoursite.com/help";                                            // TODO
const PRIVACY_URL     = "https://yoursite.com/privacy";                                         // TODO
const TERMS_URL       = "https://yoursite.com/terms";                                           // TODO
const FEEDBACK_EMAIL  = "support@yourcompany.com";                                              // TODO

/* ── Helpers ───────────────────────────────────── */

/** Convert "HH:MM" string → Date set to today at that local time. */
function timeStringToDate(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(isNaN(h) ? 8 : h, isNaN(m) ? 0 : m, 0, 0);
  return d;
}

/** Format a Date → "HH:MM" using the device local clock. */
function dateToTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Format "HH:MM" → human-readable 12-hour string, e.g. "8:00 AM". */
function formatDisplayTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

/* ── Sub-components ────────────────────────────── */

const SectionHeader = ({ title }: { title: string }) => (
  <Text
    style={{
      fontSize: 11,
      fontWeight: "700",
      color: _C.textMuted,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginTop: 28,
      marginBottom: 10,
      paddingHorizontal: 2,
    }}
  >
    {title}
  </Text>
);

const Divider = () => (
  <View
    style={{
      height: 1,
      backgroundColor: _C.border,
      marginHorizontal: 16,
    }}
  />
);

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}

const SettingsRow = ({
  icon,
  label,
  value,
  onPress,
  showArrow = false,
  destructive = false,
  rightElement,
}: SettingsRowProps) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress && !rightElement}
    style={({ pressed }) => ({ opacity: pressed && onPress ? 0.65 : 1 })}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 16,
        backgroundColor: _C.surface,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: destructive ? _C.errorFaint : _C.sageFaint,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: destructive ? "#b44" : _C.text }}>
          {label}
        </Text>
        {value ? (
          <Text style={{ fontSize: 12, color: _C.textMuted, marginTop: 2 }}>{value}</Text>
        ) : null}
      </View>
      {rightElement ? (
        rightElement
      ) : showArrow && onPress ? (
        <ChevronRight size={17} color={_C.textMuted} />
      ) : null}
    </View>
  </Pressable>
);

const SettingsCard = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      backgroundColor: _C.surface,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: _C.border,
    }}
  >
    {children}
  </View>
);

/* ── Main screen ───────────────────────────────── */

export default function SettingsScreen({
  navigation,
}: {
  navigation: any;
}) {
  const C = useColors();
  _C = C;

  const { user, signOut }                       = useAuth();
  const { isPremium, reflectionsLeft }          = usePremium();
  const { isDark, toggle: toggleDark }          = useTheme();

  // Profile
  const [displayName, setDisplayName]           = useState("");
  const [isEditingName, setIsEditingName]       = useState(false);
  const [saving, setSaving]                     = useState(false);

  // Notifications
  const [dailyReminder, setDailyReminder]       = useState(false);
  const [reminderTime, setReminderTime]         = useState("08:00");
  const [reminderDate, setReminderDate]         = useState<Date>(() => timeStringToDate("08:00"));
  const [showTimePicker, setShowTimePicker]     = useState(false);

  // Destructive actions
  const [deletingAccount, setDeletingAccount]   = useState(false);
  const [exportingData, setExportingData]       = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal]   = useState(false);
  const [currentPassword, setCurrentPassword]       = useState("");
  const [newPassword, setNewPassword]               = useState("");
  const [confirmPassword, setConfirmPassword]       = useState("");
  const [showCurrentPw, setShowCurrentPw]           = useState(false);
  const [showNewPw, setShowNewPw]                   = useState(false);
  const [showConfirmPw, setShowConfirmPw]           = useState(false);
  const [savingPassword, setSavingPassword]         = useState(false);

  /* ── Load on mount ─────────────────────────── */

  useEffect(() => {
    if (user) {
      loadProfile();
      loadNotificationPrefs();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, notification_enabled, notification_time")
        .eq("id", user.id)
        .single();
      setDisplayName(data?.display_name || "");
      if (data?.notification_enabled != null) setDailyReminder(data.notification_enabled);
      if (data?.notification_time) {
        setReminderTime(data.notification_time);
        setReminderDate(timeStringToDate(data.notification_time));
      }
    } catch {
      setDisplayName("");
    }
  };

  const loadNotificationPrefs = async () => {
    try {
      const val  = await AsyncStorage.getItem("@al_sakina_daily_reminder");
      const time = await AsyncStorage.getItem("@al_sakina_reminder_time");
      if (val !== null) setDailyReminder(val === "true");
      if (time) {
        setReminderTime(time);
        setReminderDate(timeStringToDate(time));
      }
    } catch {}
  };

  /* ── Notification handlers ─────────────────── */

  const handleToggleReminder = async (val: boolean) => {
    setDailyReminder(val);
    try {
      await AsyncStorage.setItem("@al_sakina_daily_reminder", val ? "true" : "false");

      if (val) {
        // Request permission and schedule — uses device local time automatically
        const success = await scheduleDailyReminder(reminderTime);
        if (!success) {
          // Permission denied — revert the toggle
          setDailyReminder(false);
          await AsyncStorage.setItem("@al_sakina_daily_reminder", "false");
          Alert.alert(
            "Permission required",
            "Please allow notifications for Al-Sakina in your device Settings to enable daily reminders."
          );
          return;
        }
      } else {
        await cancelDailyReminder();
      }

      // Persist to profile
      if (user) {
        await supabase
          .from("profiles")
          .update({
            notification_enabled: val,
            notification_time: reminderTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
    } catch (err) {
      console.warn("Toggle reminder error:", err);
    }
  };

  const handleTimeChange = async (event: DateTimePickerEvent, selected?: Date) => {
    // Android dismisses itself; iOS stays open until Done is pressed
    if (Platform.OS === "android") setShowTimePicker(false);
    if (event.type === "dismissed" || !selected) return;

    const newTime = dateToTimeString(selected);
    setReminderDate(selected);
    setReminderTime(newTime);

    try {
      await AsyncStorage.setItem("@al_sakina_reminder_time", newTime);
      // Reschedule immediately if reminder is already active
      if (dailyReminder) await scheduleDailyReminder(newTime);
      if (user) {
        await supabase
          .from("profiles")
          .update({ notification_time: newTime, updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    } catch (err) {
      console.warn("Time change error:", err);
    }
  };

  /* ── Other handlers ────────────────────────── */

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id);
      setIsEditingName(false);
    } catch {
      Alert.alert("Error", "Could not update name.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!user?.email) return;

    if (!currentPassword.trim()) {
      Alert.alert("Required", "Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Too short", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert("Same password", "Your new password must be different from your current one.");
      return;
    }

    setSavingPassword(true);
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        Alert.alert("Incorrect password", "Your current password is incorrect.");
        return;
      }

      // Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setShowPasswordModal(false);
      Alert.alert("Password updated", "Your password has been changed successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeEmail = () => {
    Alert.alert(
      "Change Email",
      "To change your email address, please contact support.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Contact Support",
          onPress: () => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=Change%20Email`),
        },
      ]
    );
  };

  const handleExportData = async () => {
    if (!user) return;

    // Ask format preference first
    Alert.alert(
      "Export My Data",
      "Choose an export format:",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Plain Text (.txt)", onPress: () => runExport("txt") },
        { text: "JSON (.json)", onPress: () => runExport("json") },
      ]
    );
  };

  const runExport = async (format: "json" | "txt") => {
    if (!user) return;
    setExportingData(true);
    try {
      // 1. Fetch all journal entries
      const { data: rawEntries, error: entriesError } = await supabase
        .from("journal_entries")
        .select("id, title, body, mood, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (entriesError) throw entriesError;

      // 2. Decrypt every entry on-device
      const entries = await Promise.all(
        (rawEntries || []).map(async (e) => {
          try {
            return await decryptJournalEntry(e);
          } catch {
            return e; // return as-is if decryption fails
          }
        })
      );

      // 3. Fetch saved bookmarks
      const { data: saved, error: savedError } = await supabase
        .from("saved_content")
        .select("id, content_type, content_date, content")
        .eq("user_id", user.id)
        .order("content_date", { ascending: false });

      if (savedError) throw savedError;

      const exportedAt = new Date().toISOString();
      const timestamp  = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      let fileContent: string;
      let fileName: string;
      let mimeType: string;

      if (format === "json") {
        // ── JSON export ─────────────────────────
        const payload = {
          exported_at: exportedAt,
          app: "Al-Sakina",
          version: "1.0.0",
          account: user.email,
          journal_entries: entries.map((e) => ({
            id: e.id,
            title: e.title || null,
            body: e.body,
            mood: (e as any).mood || null,
            created_at: e.created_at,
            updated_at: (e as any).updated_at || null,
          })),
          saved_content: (saved || []).map((s) => ({
            id: s.id,
            type: s.content_type,
            date: s.content_date,
            content: s.content,
          })),
        };
        fileContent = JSON.stringify(payload, null, 2);
        fileName    = `al-sakina-export-${Date.now()}.json`;
        mimeType    = "application/json";

      } else {
        // ── Plain text export ────────────────────
        const lines: string[] = [
          "AL-SAKINA — MY DATA EXPORT",
          "=".repeat(40),
          `Exported: ${timestamp}`,
          `Account:  ${user.email}`,
          "",
        ];

        // Journal entries
        lines.push(`JOURNAL ENTRIES (${entries.length})`);
        lines.push("=".repeat(40));

        if (entries.length === 0) {
          lines.push("No journal entries.");
        } else {
          entries.forEach((e, i) => {
            const date = new Date(e.created_at).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            });
            lines.push("");
            lines.push(`[${i + 1}] ${e.title || "Untitled"}`);
            lines.push(`Date: ${date}`);
            if ((e as any).mood) lines.push(`Mood: ${(e as any).mood}`);
            lines.push("-".repeat(30));
            lines.push(e.body || "");
          });
        }

        // Saved bookmarks
        lines.push("");
        lines.push("");
        lines.push(`SAVED CONTENT (${(saved || []).length})`);
        lines.push("=".repeat(40));

        const CONTENT_LABELS: Record<string, string> = {
          hadith: "Hadith",
          verse: "Quranic Verse",
          story: "Story",
          dua: "Du’a",
        };

        if (!saved || saved.length === 0) {
          lines.push("No saved content.");
        } else {
          saved.forEach((s, i) => {
            const label = CONTENT_LABELS[s.content_type] || s.content_type;
            lines.push("");
            lines.push(`[${i + 1}] ${label} · ${s.content_date}`);
            lines.push("-".repeat(30));
            const c = s.content;
            if (s.content_type === "hadith") {
              if (c.arabic)  lines.push(c.arabic);
              if (c.english) lines.push(`"${c.english}"`);
              if (c.source)  lines.push(`Source: ${c.source}`);
            } else if (s.content_type === "verse") {
              lines.push(`Theme: ${c.theme || ""}`);
              (c.verses || []).forEach((v: any) => {
                if (v.arabic)      lines.push(v.arabic);
                if (v.translation) lines.push(`"${v.translation}"`);
                if (v.reference)   lines.push(`— ${v.reference}`);
              });
            } else if (s.content_type === "story") {
              lines.push(c.title || "");
              if (c.narrative)  lines.push(c.narrative);
              if (c.source)     lines.push(`Source: ${c.source}`);
            } else if (s.content_type === "dua") {
              if (c.arabic)         lines.push(c.arabic);
              if (c.transliteration) lines.push(c.transliteration);
              if (c.translation)    lines.push(`"${c.translation}"`);
              if (c.source)         lines.push(`Source: ${c.source}`);
            }
          });
        }

        lines.push("");
        lines.push("=".repeat(40));
        lines.push("End of export · Al-Sakina");

        fileContent = lines.join("\n");
        fileName    = `al-sakina-export-${Date.now()}.txt`;
        mimeType    = "text/plain";
      }

      // 4. Write to a temp file and share
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, fileContent, {
        encoding: "utf8",
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: "Save or share your Al-Sakina data",
          UTI: format === "json" ? "public.json" : "public.plain-text",
        });
      } else {
        Alert.alert(
          "Sharing not available",
          `Your export file is saved at:\n${fileUri}`
        );
      }

    } catch (err: any) {
      console.error("Export error:", err);
      Alert.alert("Export failed", err.message || "Could not export data. Please try again.");
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data — journal entries, saved content, and your profile. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Are you absolutely sure?",
              "This action cannot be reversed.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      if (user) {
                        await cancelDailyReminder();
                        await supabase.from("journal_entries").delete().eq("user_id", user.id);
                        await supabase.from("saved_content").delete().eq("user_id", user.id);
                        await supabase.from("user_usage").delete().eq("user_id", user.id);
                        await supabase.from("profiles").delete().eq("id", user.id);
                      }
                      await signOut();
                      Alert.alert(
                        "Account deleted",
                        "Your data has been removed. Contact support to also remove your auth record."
                      );
                    } catch (err: any) {
                      Alert.alert("Error", "Could not delete account: " + (err.message || "Unknown error"));
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            ),
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try { await signOut(); navigation.goBack(); }
          catch { Alert.alert("Error", "Could not sign out."); }
        },
      },
    ]);
  };

  const handleManageSubscription = () => {
    if (isPremium) {
      Alert.alert(
        "Premium Active",
        "You have full access to all features. To manage or cancel, go to your device's subscription settings.",
        [
          { text: "OK" },
          {
            text: "Open Settings",
            onPress: () => Linking.openURL(
              Platform.OS === "ios"
                ? "https://apps.apple.com/account/subscriptions"
                : "https://play.google.com/store/account/subscriptions"
            ),
          },
        ]
      );
    } else {
      navigation.navigate("Paywall");
    }
  };

  const handleRateApp = () => {
    const url = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open the app store."));
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent("Al-Sakina Feedback");
    const body    = encodeURIComponent(`App version: 1.0.0\nOS: ${Platform.OS}\n\n---\n\n`);
    Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`)
      .catch(() => Alert.alert("Error", "No email client found."));
  };

  /* ── Avatar initials ───────────────────────── */

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  /* ── Render ────────────────────────────────── */

  return (
    <>
    <SafeAreaView style={{ flex: 1, backgroundColor: _C.background }} edges={["top"]}>

      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {/* Back button — fixed width so title can truly center */}
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, width: 70 })}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ChevronLeft size={22} color={_C.sage} />
            <Text style={{ color: _C.sage, fontSize: 15, marginLeft: 2 }}>Back</Text>
          </View>
        </Pressable>

        {/* Centered title */}
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 17,
            fontWeight: "600",
            color: _C.text,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
          }}
        >
          Settings
        </Text>

        {/* Spacer to balance back button and keep title truly centered */}
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile header ──────────────────── */}
        <View style={{ alignItems: "center", marginBottom: 4, marginTop: 8 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              backgroundColor: _C.sageFaintMid,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "700", color: _C.sage }}>
              {initials}
            </Text>
          </View>

          {isEditingName ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={_C.textMuted}
                autoFocus
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: _C.text,
                  borderBottomWidth: 1.5,
                  borderBottomColor: _C.sage,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  minWidth: 150,
                  textAlign: "center",
                }}
              />
              <Pressable onPress={handleSaveName} disabled={saving}>
                <View
                  style={{
                    backgroundColor: _C.sage,
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                  }}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="white" />
                    : <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>Save</Text>
                  }
                </View>
              </Pressable>
              <Pressable onPress={() => { setIsEditingName(false); loadProfile(); }}>
                <Text style={{ fontSize: 13, color: _C.textMuted }}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setIsEditingName(true)}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: _C.text,
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                }}
              >
                {displayName || "Tap to add name"}
              </Text>
            </Pressable>
          )}

          <Text style={{ fontSize: 13, color: _C.textMuted, marginTop: 6 }}>
            {user?.email}
          </Text>
        </View>

        {/* ── Subscription ────────────────────── */}
        <SectionHeader title="Subscription" />
        <Pressable onPress={handleManageSubscription}>
          <View
            style={{
              backgroundColor: isPremium ? _C.sageFaint : _C.surface,
              borderRadius: 16,
              padding: 18,
              borderWidth: isPremium ? 1.5 : 1,
              borderColor: isPremium ? _C.sage : _C.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Crown size={18} color={isPremium ? _C.sage : _C.textMuted} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: _C.text, marginLeft: 10 }}>
                {isPremium ? "Premium Active" : "Free Plan"}
              </Text>
              <ChevronRight size={16} color={_C.textMuted} style={{ marginLeft: "auto" }} />
            </View>
            {isPremium ? (
              <Text style={{ fontSize: 13, color: _C.sage, lineHeight: 20 }}>
                You have unlimited access to all features.{"\n"}Tap to manage your subscription.
              </Text>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: _C.textMuted, lineHeight: 20, marginBottom: 6 }}>
                  {reflectionsLeft} of {FREE_REFLECTIONS_PER_MONTH} free Sanctuary reflections remaining this month.
                </Text>
                <Text style={{ fontSize: 13, color: _C.sage, fontWeight: "600" }}>
                  Upgrade to Premium →
                </Text>
              </>
            )}
          </View>
        </Pressable>

        {/* ── Appearance ──────────────────────── */}
        <SectionHeader title="Appearance" />
        <SettingsCard>
          <SettingsRow
            icon={<Moon size={17} color={_C.sage} />}
            label="Dark Mode"
            value={isDark ? "On" : "Off"}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleDark}
                trackColor={{ false: _C.borderStrong, true: _C.sage }}
                thumbColor="white"
              />
            }
          />
        </SettingsCard>

        {/* ── Notifications ───────────────────── */}
        <SectionHeader title="Notifications" />
        <SettingsCard>

          {/* Enable/disable toggle */}
          <SettingsRow
            icon={<Bell size={17} color={_C.sage} />}
            label="Daily Reminder"
            value={
              dailyReminder
                ? `Enabled · ${formatDisplayTime(reminderTime)} · your local time`
                : "Get a gentle nudge each day"
            }
            rightElement={
              <Switch
                value={dailyReminder}
                onValueChange={handleToggleReminder}
                trackColor={{ false: _C.borderStrong, true: _C.sage }}
                thumbColor="white"
              />
            }
          />

          {/* Time picker row — only visible when reminder is on */}
          {dailyReminder && (
            <>
              <Divider />
              <Pressable onPress={() => setShowTimePicker(true)}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 13,
                    paddingHorizontal: 16,
                    backgroundColor: _C.surface,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: _C.sageFaint,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Clock size={17} color={_C.sage} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "500", color: _C.text }}>
                      Reminder Time
                    </Text>
                    <Text style={{ fontSize: 12, color: _C.textMuted, marginTop: 2 }}>
                      {formatDisplayTime(reminderTime)} · tap to change
                    </Text>
                  </View>
                  <ChevronRight size={17} color={_C.textMuted} />
                </View>
              </Pressable>
            </>
          )}
        </SettingsCard>

        {/* Native time picker — shown below the card when open */}
        {showTimePicker && (
          <View
            style={{
              backgroundColor: _C.surface,
              borderRadius: 16,
              marginTop: 8,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: _C.border,
            }}
          >
            <DateTimePicker
              value={reminderDate}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
              style={{ backgroundColor: _C.surface }}
              themeVariant={isDark ? "dark" : "light"}
            />
            {/* iOS needs an explicit Done button to dismiss the spinner */}
            {Platform.OS === "ios" && (
              <Pressable
                onPress={() => setShowTimePicker(false)}
                style={{
                  marginHorizontal: 16,
                  marginBottom: 14,
                  marginTop: 4,
                  backgroundColor: _C.sage,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }}>Done</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Privacy & Security ──────────────── */}
        <SectionHeader title="Privacy & Security" />
        <SettingsCard>
          <SettingsRow
            icon={<KeyRound size={17} color={_C.sage} />}
            label="Change Password"
            value="Change your account login password"
            onPress={handleChangePassword}
            showArrow
          />
          <Divider />
          <SettingsRow
            icon={<Shield size={17} color={_C.sage} />}
            label="Privacy"
            value="Your journal entries are encrypted on-device"
          />
        </SettingsCard>

        {/* ── Data & Storage ──────────────────── */}
        <SectionHeader title="Data & Storage" />
        <SettingsCard>
          <SettingsRow
            icon={
              exportingData
                ? <ActivityIndicator size="small" color={_C.sage} />
                : <Download size={17} color={_C.sage} />
            }
            label="Export My Data"
            value="Download your journal entries and saved content"
            onPress={exportingData ? undefined : handleExportData}
            showArrow={!exportingData}
          />
          <Divider />
          <SettingsRow
            icon={<Trash2 size={17} color={_C.textMuted} />}
            label="Clear Cache"
            value="Free up local storage"
            onPress={() => {
              Alert.alert(
                "Clear Cache",
                "This will remove locally cached content. Your journal entries and data in the cloud are safe.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    onPress: async () => {
                      await Promise.allSettled([
                        AsyncStorage.removeItem("@al_sakina_daily_content_cache"),
                        AsyncStorage.removeItem("@al_sakina_weekly_insights_cache"),
                      ]);
                      Alert.alert("Done", "Cache cleared.");
                    },
                  },
                ]
              );
            }}
            showArrow
          />
        </SettingsCard>

        {/* ── Support ─────────────────────────── */}
        <SectionHeader title="Support" />
        <SettingsCard>
          <SettingsRow
            icon={<Star size={17} color={_C.sage} />}
            label="Rate Al-Sakina"
            value="Enjoying the app? Leave a review"
            onPress={handleRateApp}
            showArrow
          />
          <Divider />
          <SettingsRow
            icon={<MessageSquare size={17} color={_C.sage} />}
            label="Send Feedback"
            value="Help us improve"
            onPress={handleSendFeedback}
            showArrow
          />
          <Divider />
          <SettingsRow
            icon={<HelpCircle size={17} color={_C.sage} />}
            label="Help Center"
            onPress={() => navigation.navigate("HelpCenterScreen")}
            showArrow
          />
        </SettingsCard>

        {/* ── Legal ───────────────────────────── */}
        <SectionHeader title="Legal" />
        <SettingsCard>
          <SettingsRow
            icon={<FileText size={17} color={_C.textMuted} />}
            label="Privacy Policy"
            onPress={() => navigation.navigate("LegalDocumentScreen", { type: "privacy" })}
            showArrow
          />
          <Divider />
          <SettingsRow
            icon={<FileText size={17} color={_C.textMuted} />}
            label="Terms of Service"
            onPress={() => navigation.navigate("LegalDocumentScreen", { type: "terms" })}
            showArrow
          />
        </SettingsCard>

        {/* ── Account ─────────────────────────── */}
        <SectionHeader title="Account" />
        <SettingsCard>
          <SettingsRow
            icon={<User size={17} color={_C.sage} />}
            label="Display Name"
            value={displayName || "Not set"}
            onPress={() => setIsEditingName(true)}
            showArrow
          />
          <Divider />
          <SettingsRow
            icon={<Mail size={17} color={_C.sage} />}
            label="Email Address"
            value={user?.email || ""}
            onPress={handleChangeEmail}
            showArrow
          />
          <Divider />
          <SettingsRow
            icon={<LogOut size={17} color="#b44" />}
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </SettingsCard>

        {/* ── Danger Zone ─────────────────────── */}
        <SectionHeader title="Danger Zone" />
        <SettingsCard>
          <SettingsRow
            icon={
              deletingAccount
                ? <ActivityIndicator size="small" color="#b44" />
                : <AlertTriangle size={17} color="#b44" />
            }
            label="Delete Account"
            value="Permanently remove all data"
            onPress={deletingAccount ? undefined : handleDeleteAccount}
            destructive
            showArrow={!deletingAccount}
          />
        </SettingsCard>

        {/* ── Footer ──────────────────────────── */}
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text
            style={{
              fontSize: 12,
              color: _C.textMuted,
              fontStyle: "italic",
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            }}
          >
            Al-Sakina
          </Text>
          <Text style={{ fontSize: 11, color: "rgba(74,74,74,0.3)", marginTop: 4 }}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>

      {/* ── Change Password Modal ───────────────── */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: _C.background }} edges={["top"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {/* Modal top bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: _C.border,
              }}
            >
              <Pressable
                onPress={() => setShowPasswordModal(false)}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, width: 70 })}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: _C.sage, fontSize: 15 }}>Cancel</Text>
                </View>
              </Pressable>
              <Text
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 17,
                  fontWeight: "600",
                  color: _C.text,
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                }}
              >
                Change Password
              </Text>
              <Pressable
                onPress={handleSavePassword}
                disabled={savingPassword}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, width: 70, alignItems: "flex-end" })}
              >
                {savingPassword
                  ? <ActivityIndicator size="small" color={_C.sage} />
                  : <Text style={{ color: _C.sage, fontSize: 15, fontWeight: "600" }}>Save</Text>
                }
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Info note */}
              <View
                style={{
                  backgroundColor: _C.sageFaint,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 28,
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <Lock size={16} color={_C.sage} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 13, color: _C.textLight, lineHeight: 20 }}>
                  For your security, enter your current password before setting a new one.
                </Text>
              </View>

              {/* Current password */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: _C.textMuted, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Current Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: _C.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: _C.border,
                  paddingHorizontal: 14,
                  marginBottom: 20,
                }}
              >
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={_C.textMuted}
                  secureTextEntry={!showCurrentPw}
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: _C.text }}
                />
                <Pressable onPress={() => setShowCurrentPw(v => !v)} hitSlop={8}>
                  {showCurrentPw
                    ? <EyeOff size={18} color={_C.textMuted} />
                    : <Eye size={18} color={_C.textMuted} />
                  }
                </Pressable>
              </View>

              {/* New password */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: _C.textMuted, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>
                New Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: _C.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: _C.border,
                  paddingHorizontal: 14,
                  marginBottom: 20,
                }}
              >
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={_C.textMuted}
                  secureTextEntry={!showNewPw}
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: _C.text }}
                />
                <Pressable onPress={() => setShowNewPw(v => !v)} hitSlop={8}>
                  {showNewPw
                    ? <EyeOff size={18} color={_C.textMuted} />
                    : <Eye size={18} color={_C.textMuted} />
                  }
                </Pressable>
              </View>

              {/* Confirm new password */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: _C.textMuted, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Confirm New Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: _C.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: confirmPassword.length > 0 && confirmPassword !== newPassword
                    ? _C.error
                    : _C.border,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                }}
              >
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={_C.textMuted}
                  secureTextEntry={!showConfirmPw}
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: _C.text }}
                />
                <Pressable onPress={() => setShowConfirmPw(v => !v)} hitSlop={8}>
                  {showConfirmPw
                    ? <EyeOff size={18} color={_C.textMuted} />
                    : <Eye size={18} color={_C.textMuted} />
                  }
                </Pressable>
              </View>
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <Text style={{ fontSize: 12, color: _C.error, marginBottom: 20 }}>
                  Passwords do not match
                </Text>
              )}

              {/* Save button */}
              <Pressable
                onPress={handleSavePassword}
                disabled={savingPassword}
                style={({ pressed }) => ({ opacity: pressed || savingPassword ? 0.7 : 1, marginTop: 12 })}
              >
                <View
                  style={{
                    backgroundColor: _C.sage,
                    borderRadius: 14,
                    paddingVertical: 15,
                    alignItems: "center",
                  }}
                >
                  {savingPassword
                    ? <ActivityIndicator color="white" />
                    : <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Update Password</Text>
                  }
                </View>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}