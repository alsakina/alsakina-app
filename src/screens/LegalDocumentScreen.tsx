// screens/LegalDocumentScreen.tsx
// ─────────────────────────────────────────────────
// Renders the Privacy Policy or Terms of Service
// in-app as a scrollable document.
//
// Usage — navigate from SettingsScreen:
//   navigation.navigate("LegalDocumentScreen", { type: "privacy" })
//   navigation.navigate("LegalDocumentScreen", { type: "terms" })
// ─────────────────────────────────────────────────

import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useColors, LightColors } from "../lib/ThemeContext";

let _C = LightColors;

/* ── Document content ──────────────────────────── */

type DocType = "privacy" | "terms";

const LAST_UPDATED = "April 2, 2026";
const APP_NAME     = "Al-Sakina";

// ── Shared primitives ───────────────────────────

interface Section {
  heading: string;
  subsections?: { heading?: string; body: string }[];
  body?: string;
}

// ── Privacy Policy sections ─────────────────────

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: "Introduction",
    body: `${APP_NAME} ("we", "our", "the app") is a personal Islamic spiritual companion. We built this app for private, sincere reflection. Protecting your privacy is not a legal formality for us — it is a core design principle. This Privacy Policy explains what information we collect, why, and how we safeguard it.\n\nBy using ${APP_NAME}, you agree to the practices described in this policy.`,
  },
  {
    heading: "1. What We Collect",
    subsections: [
      {
        heading: "1.1 Account Information",
        body: "When you create an account, we collect:\n• Email address — used for authentication and account recovery\n• Display name — optional; stored in your profile\n• Account creation and last-updated timestamps",
      },
      {
        heading: "1.2 Journal Entries",
        body: "Journal entries (title, body text, mood tag, and creation timestamp) are encrypted on your device before being stored in our cloud database. The encryption key is generated on your device and stored in your device's secure enclave using expo-secure-store. We never transmit or store your encryption key. We cannot read your journal entries.",
      },
      {
        heading: "1.3 Saved Content",
        body: "When you bookmark daily content (hadiths, Quranic verses, du'as, or stories), we store a reference to that content item along with the date it was saved. This data refers to shared content rather than your personal writing.",
      },
      {
        heading: "1.4 Usage Data",
        body: "To enforce the free-tier reflection limit, we store a monthly reflection count per user. This contains your user ID, the calendar month, and a count — nothing more.",
      },
      {
        heading: "1.5 Notification Preferences",
        body: "If you enable daily reminders, we store your notification preference (on/off) and reminder time (e.g. 08:00). This is used solely to deliver reminders and is never shared.",
      },
      {
        heading: "1.6 Subscription Status",
        body: "We store a boolean flag in your profile to manage access to premium features. Payment processing is handled entirely by Apple or Google — we never see or store your payment card details.",
      },
      {
        heading: "1.7 What We Do NOT Collect",
        body: "• We do not collect your location\n• We do not collect device identifiers or advertising IDs\n• We do not use analytics SDKs or tracking pixels\n• We do not read, scan, or train AI models on your journal entries\n• We do not sell any personal data to third parties",
      },
    ],
  },
  {
    heading: "2. How We Use Your Information",
    body: "• To authenticate you and maintain your account\n• To sync your journal entries and saved content across your devices\n• To enforce the free-tier monthly reflection limit\n• To deliver daily reminder notifications at your chosen time\n• To manage your premium subscription status\n• To generate personalised AI journal prompts and weekly insights (see Section 4)",
  },
  {
    heading: "3. How We Protect Your Information",
    subsections: [
      {
        heading: "3.1 Journal Encryption",
        body: "Journal entries are encrypted using AES-256 on your device before upload. The encryption key lives in your device's secure enclave and never leaves your device. If you uninstall the app, the key is deleted and your cloud-stored ciphertexts become permanently unreadable — even by us. We strongly recommend using the Export My Data feature before uninstalling.",
      },
      {
        heading: "3.2 Database Security",
        body: "All data is stored in Supabase, a SOC 2 Type II certified cloud database provider. Row-Level Security (RLS) policies ensure that each user's data is accessible only to that authenticated user. All data is transmitted over HTTPS/TLS.",
      },
      {
        heading: "3.3 Passwords",
        body: "Passwords are hashed and salted by Supabase Auth. We never store plaintext passwords. Password reset links expire after one hour.",
      },
    ],
  },
  {
    heading: "4. Artificial Intelligence Features",
    subsections: [
      {
        heading: "4.1 Daily Content",
        body: "The daily hadith, Quranic verses, stories, and du'as are generated by the Anthropic Claude API and stored in our database. This content is shared across all users and does not involve any personal data from your account.",
      },
      {
        heading: "4.2 AI Journal Prompts (Premium)",
        body: "When you request personalised writing prompts, we send a short preview of your most recent journal entries (up to 5 entries, each truncated to 150 characters) to the Anthropic Claude API to generate contextually relevant prompts. This data is sent over HTTPS and is subject to Anthropic's API data usage policy. Anthropic does not train models on API inputs by default. You can opt out by not using the AI prompts functionality.",
      },
      {
        heading: "4.3 Weekly Insights (Premium)",
        body: "When you request your weekly spiritual summary, we send decrypted previews of your journal entries from the past week to the Anthropic Claude API. The generated insight is saved locally on your device and is not stored in our cloud database.",
      },
      {
        heading: "4.4 Spiritual Guidance (Home Screen)",
        body: "When you share what you are feeling on the Home screen, your input is sent to the Anthropic Claude API to retrieve relevant Names of Allah and reflection text. This input is not stored in our database.",
      },
    ],
  },
  {
    heading: "5. Third-Party Services",
    body: "• Supabase (supabase.com) — Authentication, cloud database, and file storage. Acts as our data processor.\n• Anthropic (anthropic.com) — AI content generation. Journal entry excerpts are sent only when you actively use AI features.\n• Apple App Store / Google Play — In-app purchase processing. Payment data is handled entirely by Apple or Google.\n\nWe do not use Facebook SDK, Google Analytics, Mixpanel, Amplitude, or any advertising networks.",
  },
  {
    heading: "6. Data Retention and Deletion",
    subsections: [
      {
        heading: "6.1 Active Accounts",
        body: "We retain your data for as long as your account is active. You can delete individual journal entries and saved bookmarks at any time within the app.",
      },
      {
        heading: "6.2 Account Deletion",
        body: "You can permanently delete your account from Settings → Danger Zone → Delete Account. Upon deletion, all journal entries, saved content, usage records, and your profile are immediately removed from our database.",
      },
      {
        heading: "6.3 Encryption Keys",
        body: "Your journal encryption key is stored only on your device. Deleting the app or clearing app data also deletes the key. Without the key, your encrypted journal entries in the cloud are unreadable.",
      },
    ],
  },
  {
    heading: "7. Children's Privacy",
    body: "Al-Sakina is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you are located in the European Economic Area, the minimum age is 16.",
  },
  {
    heading: "8. Your Rights",
    body: "Depending on your location, you may have rights to: access your data, correct inaccuracies, delete your account and all associated data, export your data via Settings → Data & Storage → Export My Data, and object to AI processing by not using AI-powered features.\n\nTo exercise any right, contact us at the email below. We will respond within 30 days.",
  },
  {
    heading: "9. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. When we do, we will update the \"Last updated\" date at the top of this page and notify you via the app or email for material changes.",
  },
  {
    heading: "10. Contact",
    body: "If you have questions about this Privacy Policy, please contact us:\n• Email: support@yourcompany.com\n• Website: yoursite.com",
  },
];

// ── Terms of Service sections ───────────────────

const TERMS_SECTIONS: Section[] = [
  {
    heading: "Introduction",
    body: "Please read these Terms of Service (\"Terms\") carefully before using Al-Sakina. By creating an account or using the app, you agree to be bound by these Terms. If you do not agree, please do not use Al-Sakina.\n\nAl-Sakina is an Islamic spiritual companion app designed for personal reflection and growth. It is not affiliated with any mosque, Islamic organisation, or religious authority.",
  },
  {
    heading: "1. Eligibility",
    body: "You must be at least 13 years of age to use Al-Sakina. If you are located in the European Economic Area, you must be at least 16. By using the app, you confirm that you meet this requirement.\n\nYou must provide accurate registration information and keep your account credentials secure. You are responsible for all activity that occurs under your account.",
  },
  {
    heading: "2. Your Content",
    subsections: [
      {
        heading: "2.1 Ownership",
        body: "Your journal entries belong entirely to you. We claim no intellectual property rights over anything you write in Al-Sakina. Your words are your own.",
      },
      {
        heading: "2.2 Licence to Store",
        body: "By saving content to Al-Sakina, you grant us a limited, non-exclusive, royalty-free licence to store and transmit your content solely for the purpose of providing the service to you. This licence ends when you delete the content or close your account.",
      },
      {
        heading: "2.3 Responsibility",
        body: "You are solely responsible for the content you enter into the app. You agree not to enter content that violates any applicable law, infringes the intellectual property rights of others, or is intended to harm yourself or others.",
      },
    ],
  },
  {
    heading: "3. AI-Generated Content — Important Disclaimer",
    body: "Al-Sakina uses artificial intelligence to generate daily hadiths, Quranic verses, stories, du'as, journal writing prompts, weekly spiritual insights, and Name of Allah reflections.\n\n• Al-Sakina is not a religious authority. The app does not issue fatwas, rulings, or definitive religious guidance.\n• AI-generated content may contain errors, omissions, or inaccuracies. Hadith references, Quranic citations, and scholarly attributions should be verified against authoritative Islamic sources.\n• Content generated by Al-Sakina is provided for personal reflection and spiritual inspiration only. It is not a substitute for the guidance of a qualified Islamic scholar.\n• Weekly insights and journal prompts are AI interpretations of your personal writing. They are not psychological diagnoses, therapeutic advice, or spiritual verdicts.\n\nIf you have questions about Islamic rulings, please consult a qualified scholar from a recognised Islamic institution.",
  },
  {
    heading: "4. Acceptable Use",
    body: "You agree to use Al-Sakina only for lawful, personal purposes. You must not:\n• Create accounts on behalf of other people without their explicit consent\n• Attempt to reverse-engineer, decompile, or extract the app's source code or AI prompts\n• Use automated scripts, bots, or scrapers to access the service\n• Attempt to interfere with or disrupt the app's servers or infrastructure\n• Circumvent usage limits through technical means\n• Represent Al-Sakina's AI-generated content as the official position of any Islamic scholar or authority",
  },
  {
    heading: "5. Subscription and Billing",
    subsections: [
      {
        heading: "5.1 Free Tier",
        body: "All users receive access to core app features at no cost, including daily content and a limited number of Sanctuary AI reflections per calendar month.",
      },
      {
        heading: "5.2 Premium Subscription",
        body: "A Premium subscription unlocks unlimited Sanctuary AI reflections, AI-powered personalised journal writing prompts, weekly spiritual insights, custom dhikr sets, and additional features.",
      },
      {
        heading: "5.3 Billing and Renewal",
        body: "All billing is processed by Apple (iOS) or Google (Android). Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period. You can manage or cancel your subscription at any time through your device's subscription settings.",
      },
      {
        heading: "5.4 Refunds",
        body: "Refunds are governed by Apple's or Google's refund policies. We do not process refunds directly.",
      },
    ],
  },
  {
    heading: "6. Account Termination",
    subsections: [
      {
        heading: "6.1 By You",
        body: "You may delete your account at any time from Settings → Danger Zone → Delete Account. Subscription cancellation is separate and must be done through your device's subscription settings.",
      },
      {
        heading: "6.2 By Us",
        body: "We reserve the right to suspend or permanently terminate your account if you violate these Terms or engage in fraudulent activity. We will provide notice where reasonably possible.",
      },
    ],
  },
  {
    heading: "7. Intellectual Property",
    body: "Al-Sakina, its name, logo, design, and all original content created by us are protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works from this content without our written permission.",
  },
  {
    heading: "8. Disclaimers",
    body: "AL-SAKINA IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS WITHOUT WARRANTIES OF ANY KIND.\n\nWe do not warrant that the app will be uninterrupted or error-free, that AI-generated religious content is accurate or complete, or that the app will meet your specific spiritual or personal needs.\n\nThe app is a tool for personal reflection. It is not a substitute for religious guidance, mental health care, or professional advice of any kind.",
  },
  {
    heading: "9. Limitation of Liability",
    body: "TO THE FULLEST EXTENT PERMITTED BY LAW, AL-SAKINA AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING BUT NOT LIMITED TO:\n• Loss of journal entries due to device damage or account deletion\n• Reliance on AI-generated religious content\n• Service interruptions or data loss\n\nOur total liability shall not exceed the amount you paid us in the 12 months preceding the claim.",
  },
  {
    heading: "10. Changes to These Terms",
    body: "We may update these Terms from time to time. For material changes, we will provide notice through the app or by email. Continued use of Al-Sakina after changes are posted constitutes your acceptance of the revised Terms.",
  },
  {
    heading: "11. Governing Law",
    body: "These Terms are governed by and construed in accordance with the laws of [your jurisdiction]. Any disputes shall be subject to the exclusive jurisdiction of the courts of [your jurisdiction].",
  },
  {
    heading: "12. Contact",
    body: "If you have questions about these Terms, please contact us:\n• Email: support@yourcompany.com\n• Website: yoursite.com",
  },
];

/* ── Renderer components ───────────────────────── */

const DocTitle = ({ title, lastUpdated }: { title: string; lastUpdated: string }) => (
  <View style={{ marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: _C.border, alignItems: "center" }}>
    <Text
      style={{
        fontSize: 26,
        fontWeight: "700",
        color: _C.text,
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        marginBottom: 8,
        textAlign: "center",
        lineHeight: 34,
      }}
    >
      {title}
    </Text>
    <Text style={{ fontSize: 13, color: _C.textMuted, textAlign: "center" }}>
      Last updated: {lastUpdated}
    </Text>
  </View>
);

const IntroText = ({ text }: { text: string }) => (
  <Text
    style={{
      fontSize: 14,
      color: _C.textLight,
      lineHeight: 22,
      marginBottom: 24,
    }}
  >
    {text}
  </Text>
);

const SectionBlock = ({ section }: { section: Section }) => (
  <View style={{ marginBottom: 24 }}>
    {/* Section heading */}
    <Text
      style={{
        fontSize: 16,
        fontWeight: "700",
        color: _C.sage,
        marginBottom: 10,
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
      }}
    >
      {section.heading}
    </Text>

    {/* Direct body */}
    {section.body ? (
      <Text style={{ fontSize: 14, color: _C.text, lineHeight: 22, marginBottom: 4 }}>
        {section.body}
      </Text>
    ) : null}

    {/* Subsections */}
    {section.subsections?.map((sub, i) => (
      <View key={i} style={{ marginTop: 12, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: _C.sageFaintMid }}>
        {sub.heading ? (
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: _C.text,
              marginBottom: 6,
            }}
          >
            {sub.heading}
          </Text>
        ) : null}
        <Text style={{ fontSize: 14, color: _C.text, lineHeight: 22 }}>
          {sub.body}
        </Text>
      </View>
    ))}
  </View>
);

/* ── Main screen ───────────────────────────────── */

export default function LegalDocumentScreen({
  route,
  navigation,
}: {
  route: { params: { type: DocType } };
  navigation: any;
}) {
  const C = useColors();
  _C = C;

  const { type } = route.params;
  const isPrivacy = type === "privacy";

  const title    = isPrivacy ? "Privacy Policy"   : "Terms of Service";
  const sections = isPrivacy ? PRIVACY_SECTIONS   : TERMS_SECTIONS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: _C.background }} edges={["top"]}>

      {/* Top bar */}
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
            fontSize: 17,
            fontWeight: "600",
            color: _C.text,
            fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Spacer to balance the back button and keep title truly centered */}
        <View style={{ width: 50 }} />
      </View>

      {/* Document body */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Document title + date */}
        <DocTitle title={`Al-Sakina\n${title}`} lastUpdated={LAST_UPDATED} />

        {/* Sections */}
        {sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}

        {/* Footer */}
        <View
          style={{
            marginTop: 16,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: _C.border,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: _C.textMuted,
              fontStyle: "italic",
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            }}
          >
            Al-Sakina · {title}
          </Text>
          <Text style={{ fontSize: 11, color: _C.textMuted, marginTop: 4 }}>
            Document version 1.0 · {LAST_UPDATED}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}