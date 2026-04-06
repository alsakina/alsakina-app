// screens/PaywallScreen.tsx
// ─────────────────────────────────────────────────
// For now: shows the paywall UI without real purchases.
// When RevenueCat is set up, uncomment the purchase logic.
// ─────────────────────────────────────────────────

import React from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Check, Sparkles } from "lucide-react-native";
import { Colors } from "../lib/theme";
import { usePremium } from "../lib/PremiumContext";

const FEATURES = [
  "Unlimited Sanctuary reflections",
  "AI-powered journal prompts",
  "Weekly spiritual insights",
  "Custom dhikr sets",
  "Regenerate Name explanations",
  "Refresh daily Garden content",
];

export default function PaywallScreen({
  navigation,
}: {
  navigation: any;
}) {
  const { reflectionsLeft } = usePremium();

  const handlePurchase = (plan: string) => {
    // TODO: Replace with RevenueCat purchase when ready
    Alert.alert(
      "Coming Soon",
      `The ${plan} subscription will be available when the app launches. For now, you're testing the free tier with ${reflectionsLeft} reflections remaining this month.`
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }}>
      {/* Close button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={{ padding: 4 }}
        >
          <X size={22} color={Colors.charcoalMuted} />
        </Pressable>
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: 28,
          justifyContent: "center",
        }}
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(135,169,107,0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Sparkles size={28} color={Colors.sage} />
          </View>
          <Text
            style={{
              fontSize: 26,
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Unlock Al-Sakina
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Colors.charcoalMuted,
              textAlign: "center",
              lineHeight: 20,
              maxWidth: 280,
            }}
          >
            Deepen your connection with personalized AI-powered spiritual
            guidance
          </Text>
        </View>

        {/* Feature list */}
        <View style={{ marginBottom: 28 }}>
          {FEATURES.map((feature, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <Check size={18} color={Colors.sage} />
              <Text
                style={{
                  fontSize: 15,
                  color: Colors.charcoal,
                  marginLeft: 12,
                }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Package options */}
        <View style={{ gap: 10, marginBottom: 20 }}>
          <Pressable onPress={() => handlePurchase("yearly")}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: Colors.sage,
                backgroundColor: "rgba(135,169,107,0.06)",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: Colors.charcoal,
                  }}
                >
                  Yearly
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.sage,
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  Save 50%
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.charcoal,
                }}
              >
                $29.99/yr
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={() => handlePurchase("monthly")}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: "rgba(135,169,107,0.15)",
                backgroundColor: "white",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.charcoal,
                }}
              >
                Monthly
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.charcoal,
                }}
              >
                $4.99/mo
              </Text>
            </View>
          </Pressable>
        </View>

        {/* CTA */}
        <Pressable onPress={() => handlePurchase("yearly")}>
          <View
            style={{
              backgroundColor: Colors.sage,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "white", fontSize: 16, fontWeight: "700" }}
            >
              Start 7-Day Free Trial
            </Text>
          </View>
        </Pressable>

        <Text
          style={{
            fontSize: 11,
            color: Colors.charcoalMuted,
            textAlign: "center",
            marginTop: 16,
            lineHeight: 16,
          }}
        >
          Cancel anytime. Payment charged after free trial ends.
        </Text>
      </View>
    </SafeAreaView>
  );
}