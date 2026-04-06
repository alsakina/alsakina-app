// screens/HelpCenterScreen.tsx
// ─────────────────────────────────────────────────
// In-app Help Center with categorised FAQs and
// an expandable accordion UI.
//
// Navigate from SettingsScreen:
//   navigation.navigate("HelpCenterScreen")
// ─────────────────────────────────────────────────

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Heart,
  BookOpen,
  NotebookPen,
  Sprout,
  Circle,
  Crown,
  Shield,
  HelpCircle,
} from "lucide-react-native";
import { useColors, LightColors } from "../lib/ThemeContext";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

let _C = LightColors;

/* ── FAQ data ──────────────────────────────────── */

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "getting_started",
    label: "Getting Started",
    icon: <HelpCircle size={18} color="#87A96B" />,
    items: [
      {
        q: "Do I need an account to use Al-Sakina?",
        a: "You can browse the Garden (daily hadith, Quranic verses, stories, and du'as) and explore the 99 Names of Allah without an account. However, to use the Sanctuary, save bookmarks, write journal entries, track your dhikr, and access your history across devices, you'll need to create a free account.",
      },
      {
        q: "Is Al-Sakina free to use?",
        a: "Yes — Al-Sakina has a generous free tier. You get access to daily content, the 99 Names library, dhikr counter, and 3 Sanctuary AI reflections per month. A Premium subscription unlocks unlimited reflections, AI-powered journal prompts, weekly spiritual insights, custom dhikr sets, and more.",
      },
      {
        q: "How do I create an account?",
        a: "Tap the settings gear icon on any screen, or try to use a feature that requires sign-in. You'll be taken to the sign-in screen where you can create an account with your email address and a password.",
      },
      {
        q: "I forgot my password. How do I reset it?",
        a: "Go to Settings → Account → Change Password. We'll send a password reset link to your registered email address. The link expires after one hour. If you don't see it, check your spam folder.",
      },
    ],
  },
  {
    id: "sanctuary",
    label: "Sanctuary",
    icon: <Heart size={18} color="#87A96B" />,
    items: [
      {
        q: "What is the Sanctuary?",
        a: "The Sanctuary is Al-Sakina's heart — a private space where you share what's weighing on you, and receive a gentle reflection featuring the Names of Allah (Asma ul-Husna) that are most relevant to your situation. It is designed as a moment of stillness and connection.",
      },
      {
        q: "How many reflections do I get on the free plan?",
        a: "Free accounts receive 3 Sanctuary reflections per calendar month. The counter resets at the start of each month. Upgrade to Premium for unlimited reflections.",
      },
      {
        q: "Is my reflection private?",
        a: "Your input in the Sanctuary is sent to the Anthropic Claude AI to generate a response — it is not stored in our database. Your journal entries are a separate feature and are encrypted on your device. See our Privacy Policy for full details.",
      },
      {
        q: "Why does the Sanctuary sometimes take a moment to respond?",
        a: "The response is generated live by an AI model, which takes a few seconds. If you see a loading indicator, the app is working on your reflection. Please ensure you have an internet connection.",
      },
      {
        q: "Can I save a Sanctuary reflection to my Journal?",
        a: "Yes — after receiving a reflection, tap the bookmark icon to save it directly to your Journal as a new entry.",
      },
    ],
  },
  {
    id: "journal",
    label: "Journal",
    icon: <NotebookPen size={18} color="#87A96B" />,
    items: [
      {
        q: "Are my journal entries private?",
        a: "Yes. Journal entries are encrypted on your device using AES-256 encryption before being stored in the cloud. The encryption key lives in your device's secure enclave (iOS Keychain / Android Keystore) and never leaves your device. We are technically unable to read your entries.",
      },
      {
        q: "What happens to my journal if I uninstall the app?",
        a: "If you uninstall the app, your encryption key is deleted from your device. Your entries are still stored in the cloud as encrypted ciphertext, but they become permanently unreadable without the key. We strongly recommend using Settings → Data & Storage → Export My Data before uninstalling.",
      },
      {
        q: "What are AI journal prompts?",
        a: "Premium users can request personalised writing prompts before starting a journal entry. The app sends short previews of your recent entries (up to 5 entries, each truncated to 150 characters) to the AI, which suggests 3 thoughtful reflection questions tailored to what you've been experiencing.",
      },
      {
        q: "Can I edit a journal entry after saving it?",
        a: "Yes. Tap any entry in your Journal to open it. You'll see your original entry in read-only mode, with an editable Notes section below where you can add further thoughts. Your original writing is preserved.",
      },
      {
        q: "What are the mood tags for?",
        a: "Mood tags (Grateful, Hopeful, Peaceful, Anxious, Sad, etc.) help you track your emotional and spiritual state over time. They also inform the AI when generating personalised prompts and weekly insights, so it can better reflect your journey.",
      },
      {
        q: "What is the Saved tab in my Journal?",
        a: "The Saved tab shows content you've bookmarked from the Garden — hadiths, Quranic verses, du'as, and stories. Tap any saved item to view it again in full.",
      },
    ],
  },
  {
    id: "garden",
    label: "Garden",
    icon: <Sprout size={18} color="#87A96B" />,
    items: [
      {
        q: "What is the Garden?",
        a: "The Garden is your daily spiritual nourishment. Every day it offers four fresh pieces of content: a Hadith of the Day, a Quranic Verse of the Day, a Story of the Day, and a Du'a of the Day. Tap any tile to read the full content.",
      },
      {
        q: "Is the daily content different every day?",
        a: "Yes. New content is generated each day and stored in our database. Content from previous days is archived and accessible to Premium users by scrolling back in the date picker at the top of the Garden screen.",
      },
      {
        q: "Can I bookmark Garden content?",
        a: "Yes. On any daily content screen, tap the bookmark icon to save it. Saved items appear in the Saved tab of your Journal.",
      },
      {
        q: "Can I search past Garden content?",
        a: "Yes — tap the search icon on the Garden screen. Free users see up to 3 search results; Premium users see all results from the full archive.",
      },
      {
        q: "Is the AI-generated Islamic content accurate?",
        a: "Al-Sakina uses AI to generate daily content. While we aim for accuracy, AI-generated hadiths, Quranic references, and scholarly attributions should always be verified against authoritative Islamic sources. Al-Sakina is a tool for reflection and inspiration — it is not a religious authority and does not issue rulings or fatwas.",
      },
    ],
  },
  {
    id: "library",
    label: "Library (99 Names)",
    icon: <BookOpen size={18} color="#87A96B" />,
    items: [
      {
        q: "What is the Library?",
        a: "The Library contains the 99 Names of Allah (Asma ul-Husna). Each Name includes its Arabic text, transliteration, meaning, Quranic verses, prophetic stories that illustrate the Name, how to reflect on it in daily life, and a related du'a.",
      },
      {
        q: "How is the Name of the Day chosen?",
        a: "The Name of the Day rotates deterministically through all 99 Names based on the day of the year. Every user on the same day sees the same Name, creating a shared daily reflection.",
      },
      {
        q: "Can I regenerate a Name's explanation?",
        a: "Premium users can tap the regenerate button on any Name detail page to get a freshly AI-generated explanation. This is useful if you'd like a different perspective or emphasis on the same Name.",
      },
      {
        q: "Can I search the Names?",
        a: "Yes — use the search bar at the top of the Library screen to search by transliteration (e.g. 'Ar-Rahman'), English meaning (e.g. 'merciful'), or Arabic text.",
      },
    ],
  },
  {
    id: "dhikr",
    label: "Dhikr Counter",
    icon: <Circle size={18} color="#87A96B" />,
    items: [
      {
        q: "What is the Dhikr counter?",
        a: "The Dhikr screen is a digital counter for remembrance of Allah. Tap the circle to count each dhikr. The progress ring fills as you approach your target (default: 33). Your counts are saved daily to track your consistency over time.",
      },
      {
        q: "Which dhikr options are available?",
        a: "The built-in presets are SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Astaghfirullah, and Salawat (blessings upon the Prophet ﷺ). Tap 'Change dhikr' to switch between them.",
      },
      {
        q: "Can I set a custom dhikr target?",
        a: "Custom dhikr sets are a Premium feature. Premium users can create their own dhikr with custom Arabic text and target counts.",
      },
      {
        q: "Is my dhikr history saved?",
        a: "Yes — if you are signed in, your daily dhikr counts are saved to your account and you can view your history by tapping the History icon on the Dhikr screen.",
      },
    ],
  },
  {
    id: "premium",
    label: "Premium",
    icon: <Crown size={18} color="#87A96B" />,
    items: [
      {
        q: "What does Premium include?",
        a: "Premium unlocks: unlimited Sanctuary reflections, AI-powered personalised journal prompts, weekly spiritual insights, custom dhikr sets, the ability to regenerate Name of Allah explanations, the ability to refresh daily Garden content, and access to the full Garden archive.",
      },
      {
        q: "How do I upgrade to Premium?",
        a: "Tap Settings → Subscription → Upgrade to Premium, or tap any Premium feature prompt within the app. Subscriptions are available monthly or yearly.",
      },
      {
        q: "How do I cancel my subscription?",
        a: "Subscriptions are managed through Apple (iOS) or Google (Android). Go to Settings → Subscription → Manage, which will open your device's subscription settings. You can cancel there at any time.",
      },
      {
        q: "What are Weekly Insights?",
        a: "Weekly Insights is a Premium feature that analyses your journal entries from the past 7 days and generates a warm, personalised spiritual summary — including a mood pattern observation, signs of growth, a Quranic reflection relevant to your week, a suggestion for the coming week, and a du'a for your situation. Access it from your Journal screen.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & Security",
    icon: <Shield size={18} color="#87A96B" />,
    items: [
      {
        q: "How is my data protected?",
        a: "Journal entries are encrypted with AES-256 on your device before reaching our servers. The encryption key is stored in your device's secure enclave and never transmitted. Your Supabase database is protected by Row-Level Security policies that ensure only you can access your data.",
      },
      {
        q: "Does Al-Sakina sell my data?",
        a: "No. We do not sell personal data to any third party. We do not use advertising networks, analytics SDKs, or tracking pixels. Your data is used only to provide you with the app's features.",
      },
      {
        q: "What data is sent to the AI?",
        a: "When you use AI features: your Sanctuary input is sent to generate a reflection; short previews of recent journal entries (truncated to 150 characters each) are sent for AI prompts; and weekly entry previews are sent for Weekly Insights. None of this is stored in our database after processing.",
      },
      {
        q: "How do I delete my account and all my data?",
        a: "Go to Settings → Danger Zone → Delete Account. This permanently deletes your journal entries, saved content, usage history, and profile from our database. Your subscription must be cancelled separately through your device's subscription settings.",
      },
      {
        q: "Can I export my data?",
        a: "Yes — go to Settings → Data & Storage → Export My Data to download a copy of your journal entries and saved content.",
      },
    ],
  },
];

/* ── Sub-components ────────────────────────────── */

const CategoryPill = ({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: active ? _C.sage : _C.surface,
        borderWidth: 1,
        borderColor: active ? _C.sage : _C.border,
        marginRight: 8,
        gap: 6,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "white" : _C.textMuted }}>
        {label}
      </Text>
    </View>
  </Pressable>
);

const AccordionItem = ({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <View
    style={{
      borderBottomWidth: 1,
      borderBottomColor: _C.border,
    }}
  >
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
          paddingHorizontal: 16,
          backgroundColor: _C.surface,
          gap: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "500",
            color: _C.text,
            lineHeight: 22,
          }}
        >
          {item.q}
        </Text>
        {isOpen
          ? <ChevronUp size={18} color={_C.sage} />
          : <ChevronDown size={18} color={_C.textMuted} />
        }
      </View>
    </Pressable>

    {isOpen && (
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 4,
          backgroundColor: _C.surface,
        }}
      >
        <View
          style={{
            borderLeftWidth: 2,
            borderLeftColor: _C.sageFaintMid,
            paddingLeft: 12,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: _C.textLight,
              lineHeight: 22,
            }}
          >
            {item.a}
          </Text>
        </View>
      </View>
    )}
  </View>
);

/* ── Main screen ───────────────────────────────── */

export default function HelpCenterScreen({
  navigation,
}: {
  navigation: any;
}) {
  const C = useColors();
  _C = C;

  const [searchQuery, setSearchQuery]         = useState("");
  const [activeCategory, setActiveCategory]   = useState<string | null>(null);
  const [openItems, setOpenItems]             = useState<Set<string>>(new Set());

  // Filter FAQs based on search query and active category
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return FAQ_CATEGORIES
      .filter((cat) => !activeCategory || cat.id === activeCategory)
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          if (!query) return true;
          return (
            item.q.toLowerCase().includes(query) ||
            item.a.toLowerCase().includes(query)
          );
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery, activeCategory]);

  const toggleItem = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const totalResults = filteredCategories.reduce(
    (sum, cat) => sum + cat.items.length, 0
  );

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
          Help Center
        </Text>

        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 20,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: _C.sageFaintMid,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <HelpCircle size={28} color={_C.sage} />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: _C.text,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            How can we help?
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: _C.textMuted,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Search or browse the questions below
          </Text>
        </View>

        {/* Search bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: _C.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: _C.border,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === "ios" ? 12 : 8,
              gap: 10,
            }}
          >
            <Search size={18} color={_C.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search questions..."
              placeholderTextColor={_C.textMuted}
              style={{
                flex: 1,
                fontSize: 15,
                color: _C.text,
              }}
              returnKeyType="search"
              clearButtonMode="never"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={clearSearch} hitSlop={8}>
                <X size={17} color={_C.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        >
          <CategoryPill
            label="All"
            icon={<HelpCircle size={14} color={!activeCategory ? "white" : _C.textMuted} />}
            active={!activeCategory}
            onPress={() => setActiveCategory(null)}
          />
          {FAQ_CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              active={activeCategory === cat.id}
              onPress={() => setActiveCategory(
                activeCategory === cat.id ? null : cat.id
              )}
            />
          ))}
        </ScrollView>

        {/* Search results count */}
        {searchQuery.trim().length > 0 && (
          <Text
            style={{
              paddingHorizontal: 20,
              marginBottom: 12,
              fontSize: 13,
              color: _C.textMuted,
            }}
          >
            {totalResults} result{totalResults !== 1 ? "s" : ""} for "{searchQuery.trim()}"
          </Text>
        )}

        {/* FAQ sections */}
        {filteredCategories.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 48, paddingHorizontal: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: _C.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No results found
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: _C.textMuted,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Try different keywords or browse a category above
            </Text>
          </View>
        ) : (
          filteredCategories.map((cat) => (
            <View key={cat.id} style={{ marginBottom: 8 }}>
              {/* Category heading */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 10,
                  gap: 8,
                }}
              >
                {cat.icon}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: _C.sage,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {cat.label}
                </Text>
              </View>

              {/* Card with accordion items */}
              <View
                style={{
                  marginHorizontal: 20,
                  backgroundColor: _C.surface,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: _C.border,
                }}
              >
                {cat.items.map((item, idx) => {
                  const key = `${cat.id}-${idx}`;
                  return (
                    <AccordionItem
                      key={key}
                      item={item}
                      isOpen={openItems.has(key)}
                      onToggle={() => toggleItem(key)}
                    />
                  );
                })}
              </View>
            </View>
          ))
        )}

        {/* Footer contact prompt */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 24,
            padding: 20,
            backgroundColor: _C.sageFaint,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: _C.border,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: _C.text,
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            Still have a question?
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: _C.textMuted,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Use Settings → Support → Send Feedback to reach us directly.
            We read every message.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}