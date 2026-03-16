// screens/SettingsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  User,
  Mail,
  Crown,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react-native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";
import { usePremium, FREE_REFLECTIONS_PER_MONTH } from "../lib/PremiumContext";
import { supabase } from "../lib/supabase";

/* ── Section header ────────────────────────────── */

const SectionHeader = ({ title }: { title: string }) => (
  <Text
    style={{
      fontSize: 12,
      fontWeight: "700",
      color: Colors.charcoalMuted,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 10,
      marginTop: 24,
      paddingHorizontal: 4,
    }}
  >
    {title}
  </Text>
);

/* ── Row component ─────────────────────────────── */

const SettingsRow = ({
  icon,
  label,
  value,
  onPress,
  destructive,
  showArrow,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showArrow?: boolean;
}) => (
  <Pressable onPress={onPress} disabled={!onPress}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "rgba(135,169,107,0.08)",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: destructive
            ? "rgba(180,68,68,0.08)"
            : "rgba(135,169,107,0.08)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: destructive ? "#b44" : Colors.charcoal,
          }}
        >
          {label}
        </Text>
        {value ? (
          <Text
            style={{
              fontSize: 13,
              color: Colors.charcoalMuted,
              marginTop: 2,
            }}
          >
            {value}
          </Text>
        ) : null}
      </View>
      {showArrow && onPress && (
        <ChevronRight size={18} color={Colors.charcoalMuted} />
      )}
    </View>
  </Pressable>
);

/* ── Main screen ───────────────────────────────── */

export default function SettingsScreen({
  navigation,
}: {
  navigation: any;
}) {
  const { user, signOut } = useAuth();
  const { isPremium, reflectionsUsed, reflectionsLeft } = usePremium();

  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      setDisplayName(data?.display_name || "");
    } catch {
      setDisplayName("");
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      setIsEditingName(false);
    } catch (err: any) {
      Alert.alert("Error", "Could not update name.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Error", "Could not sign out.");
            }
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    if (isPremium) {
      Alert.alert(
        "Premium Active",
        "You have full access to all features. To manage your subscription, go to your device's subscription settings."
      );
    } else {
      navigation.navigate("Paywall");
    }
  };

  // Get user initials for avatar
  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

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
            Back
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          {/* Avatar circle */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              backgroundColor: "rgba(135,169,107,0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: Colors.sage,
              }}
            >
              {initials}
            </Text>
          </View>

          {/* Editable name */}
          {isEditingName ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={Colors.charcoalMuted}
                autoFocus
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: Colors.charcoal,
                  borderBottomWidth: 1.5,
                  borderBottomColor: Colors.sage,
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  minWidth: 150,
                  textAlign: "center",
                }}
              />
              <Pressable onPress={handleSaveName} disabled={saving}>
                <View
                  style={{
                    backgroundColor: Colors.sage,
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      style={{
                        color: "white",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Save
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setIsEditingName(true)}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: Colors.charcoal,
                  fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                }}
              >
                {displayName || "Tap to add name"}
              </Text>
            </Pressable>
          )}

          <Text
            style={{
              fontSize: 13,
              color: Colors.charcoalMuted,
              marginTop: 6,
            }}
          >
            {user?.email}
          </Text>
        </View>

        {/* ── Subscription ──────────────────────── */}
        <SectionHeader title="Subscription" />

        <Pressable onPress={handleManageSubscription}>
          <View
            style={{
              backgroundColor: isPremium
                ? "rgba(135,169,107,0.08)"
                : "white",
              borderRadius: 16,
              padding: 18,
              marginBottom: 8,
              borderWidth: isPremium ? 1.5 : 1,
              borderColor: isPremium
                ? Colors.sage
                : "rgba(135,169,107,0.08)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Crown
                size={18}
                color={isPremium ? Colors.sage : Colors.charcoalMuted}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.charcoal,
                  marginLeft: 10,
                }}
              >
                {isPremium ? "Premium Active" : "Free Plan"}
              </Text>
            </View>

            {isPremium ? (
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.sage,
                  lineHeight: 20,
                }}
              >
                You have unlimited access to all features.
              </Text>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.charcoalMuted,
                    lineHeight: 20,
                    marginBottom: 6,
                  }}
                >
                  {reflectionsLeft} of {FREE_REFLECTIONS_PER_MONTH} free
                  Sanctuary reflections remaining this month.
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.sage,
                    fontWeight: "600",
                  }}
                >
                  Upgrade to Premium →
                </Text>
              </>
            )}
          </View>
        </Pressable>

        {/* ── Account ───────────────────────────── */}
        <SectionHeader title="Account" />

        <SettingsRow
          icon={<User size={18} color={Colors.sage} />}
          label="Display Name"
          value={displayName || "Not set"}
          onPress={() => setIsEditingName(true)}
          showArrow
        />

        <SettingsRow
          icon={<Mail size={18} color={Colors.sage} />}
          label="Email"
          value={user?.email || ""}
        />

        <SettingsRow
          icon={<Shield size={18} color={Colors.sage} />}
          label="Privacy"
          value="Your journal entries are encrypted on-device"
        />

        {/* ── Sign Out ──────────────────────────── */}
        <View style={{ marginTop: 24 }}>
          <SettingsRow
            icon={<LogOut size={18} color="#b44" />}
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </View>

        {/* Footer */}
        <View style={{ alignItems: "center", marginTop: 32 }}>
          <Text
            style={{
              fontSize: 12,
              color: Colors.charcoalMuted,
              fontStyle: "italic",
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            }}
          >
            Al-Sakina
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: "rgba(74,74,74,0.3)",
              marginTop: 4,
            }}
          >
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}