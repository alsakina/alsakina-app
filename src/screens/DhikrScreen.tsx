// screens/DhikrScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RotateCcw, ChevronDown, ChevronUp, History } from "lucide-react-native";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import ScreenHeader from "../components/ScreenHeader";

/* ── Date helper (local timezone) ──────────────── */

function getTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getRecentDates(count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(getDateLocal(d));
  }
  return dates;
}

interface DayHistory {
  date: string;
  total: number;
  breakdown: { key: string; transliteration: string; count: number }[];
}

/* ── Transliteration lookup ────────────────────── */

const DHIKR_LABELS: Record<string, string> = {
  subhanallah: "SubhanAllah",
  alhamdulillah: "Alhamdulillah",
  allahuakbar: "Allahu Akbar",
  lailahaillallah: "La ilaha illallah",
  astaghfirullah: "Astaghfirullah",
  salawat: "Salawat",
};

/* ── Built-in dhikr options ────────────────────── */

interface DhikrOption {
  key: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
}

const DHIKR_PRESETS: DhikrOption[] = [
  {
    key: "subhanallah",
    arabic: "سُبْحَانَ ٱللَّهِ",
    transliteration: "SubhanAllah",
    translation: "Glory be to Allah",
    target: 33,
  },
  {
    key: "alhamdulillah",
    arabic: "ٱلْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
    translation: "All praise is due to Allah",
    target: 33,
  },
  {
    key: "allahuakbar",
    arabic: "ٱللَّهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    translation: "Allah is the Greatest",
    target: 33,
  },
  {
    key: "lailahaillallah",
    arabic: "لَا إِلَٰهَ إِلَّا ٱللَّهُ",
    transliteration: "La ilaha illallah",
    translation: "There is no god but Allah",
    target: 100,
  },
  {
    key: "astaghfirullah",
    arabic: "أَسْتَغْفِرُ ٱللَّهَ",
    transliteration: "Astaghfirullah",
    translation: "I seek forgiveness from Allah",
    target: 100,
  },
  {
    key: "salawat",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
    transliteration: "Allahumma salli 'ala Muhammad",
    translation: "O Allah, send blessings upon Muhammad",
    target: 100,
  },
];

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

/* ── Circular progress ring (SVG) ──────────────── */

const ProgressRing = ({
  progress,
  size = 260,
  strokeWidth = 6,
}: {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <Svg width={size} height={size}>
      {/* Background track */}
      <SvgCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(135,169,107,0.12)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress arc — starts at 12 o'clock */}
      <SvgCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.sage}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

/* ── Dhikr selector pill ───────────────────────── */

const DhikrPill = ({
  option,
  isSelected,
  onPress,
}: {
  option: DhikrOption;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: isSelected ? "rgba(135,169,107,0.2)" : "white",
      borderWidth: 1.5,
      borderColor: isSelected ? Colors.sage : "rgba(135,169,107,0.08)",
      marginRight: 8,
      alignItems: "center",
      minWidth: 90,
    }}
  >
    <Text
      style={{
        fontSize: 16,
        color: Colors.charcoal,
        fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
        marginBottom: 2,
      }}
    >
      {option.arabic}
    </Text>
    <Text
      style={{
        fontSize: 11,
        color: isSelected ? Colors.sage : Colors.charcoalMuted,
        fontWeight: "600",
      }}
    >
      {option.transliteration}
    </Text>
  </Pressable>
);

/* ── Main screen ───────────────────────────────── */

export default function DhikrScreen() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<DhikrOption>(DHIKR_PRESETS[0]);

  // `ringCount`    — what the ring displays (resets to 0 on Reset)
  // `sessionOffset`— the Supabase total when the ring was last reset;
  //                  taps save (sessionOffset + ringCount) to Supabase
  const [ringCount, setRingCount] = useState(0);
  const [sessionOffset, setSessionOffset] = useState(0);

  const [todayTotal, setTodayTotal] = useState(0);
  const [showSelector, setShowSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  // Progress is ring-only (0 → target), so it resets visually each cycle
  const progress = ringCount / selected.target;
  const isComplete = ringCount >= selected.target;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadTodayCount();
        loadHistory();
      }
    }, [user, selected.key])
  );

  const loadTodayCount = async () => {
    if (!user) return;
    const today = getTodayLocal();
    try {
      const { data } = await supabase
        .from("dhikr_logs")
        .select("count")
        .eq("user_id", user.id)
        .eq("dhikr_key", selected.key)
        .eq("date", today)
        .single();

      const savedCount = data?.count ?? 0;
      // On load, the ring shows however many are in Supabase (capped at target)
      // and the offset is whatever is above the ring's target
      setRingCount(savedCount % selected.target || (savedCount > 0 ? savedCount : 0));
      setSessionOffset(Math.floor(savedCount / selected.target) * selected.target);

      // Total across all dhikr today
      const { data: allData } = await supabase
        .from("dhikr_logs")
        .select("count")
        .eq("user_id", user.id)
        .eq("date", today);

      const total = (allData || []).reduce(
        (sum: number, row: any) => sum + row.count,
        0
      );
      setTodayTotal(total);
    } catch {
      setRingCount(0);
      setSessionOffset(0);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    try {
      const dates = getRecentDates(7);
      const oldest = dates[dates.length - 1];

      const { data } = await supabase
        .from("dhikr_logs")
        .select("dhikr_key, count, date")
        .eq("user_id", user.id)
        .gte("date", oldest)
        .order("date", { ascending: false });

      if (!data) {
        setHistory([]);
        return;
      }

      const dayMap: Record<string, { key: string; count: number }[]> = {};
      for (const row of data) {
        if (!dayMap[row.date]) dayMap[row.date] = [];
        dayMap[row.date].push({ key: row.dhikr_key, count: row.count });
      }

      const days: DayHistory[] = dates.map((dateStr) => {
        const entries = dayMap[dateStr] || [];
        const total = entries.reduce((sum, e) => sum + e.count, 0);
        const breakdown = entries
          .filter((e) => e.count > 0)
          .map((e) => ({
            key: e.key,
            transliteration: DHIKR_LABELS[e.key] || e.key,
            count: e.count,
          }))
          .sort((a, b) => b.count - a.count);
        return { date: dateStr, total, breakdown };
      });

      setHistory(days);
    } catch (err) {
      console.warn("History load error:", err);
    }
  };

  const handleTap = async () => {
    const newRingCount = ringCount + 1;
    setRingCount(newRingCount);
    setTodayTotal((prev) => prev + 1);

    Vibration.vibrate(10);

    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (newRingCount === selected.target) {
      Vibration.vibrate([0, 100, 50, 100]);
    }

    // The true cumulative count = offset + ring count
    const totalCount = sessionOffset + newRingCount;

    if (user) {
      const today = getTodayLocal();
      try {
        const { data: existing } = await supabase
          .from("dhikr_logs")
          .select("id, count")
          .eq("user_id", user.id)
          .eq("dhikr_key", selected.key)
          .eq("date", today)
          .single();

        if (existing) {
          await supabase
            .from("dhikr_logs")
            .update({ count: totalCount })
            .eq("id", existing.id);
        } else {
          await supabase.from("dhikr_logs").insert({
            user_id: user.id,
            dhikr_key: selected.key,
            count: totalCount,
            date: today,
          });
        }
      } catch (err) {
        console.warn("Dhikr save error:", err);
      }
    }
  };

  const handleReset = () => {
    // Move the current ring count into the offset so the Supabase total
    // is preserved. The ring resets to 0 visually.
    setSessionOffset((prev) => prev + ringCount);
    setRingCount(0);
    // todayTotal is intentionally NOT touched — it keeps accumulating
  };

  const switchDhikr = (option: DhikrOption) => {
    setSelected(option);
    setRingCount(0);
    setSessionOffset(0);
    setShowSelector(false);
    if (user) loadTodayCount();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.cream }}
      edges={["top"]}
    >
      <ScreenHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={{
            opacity: headerFade,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <DiamondAccent />
          <Text
            style={{
              fontSize: 24,
              color: Colors.charcoal,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
              marginBottom: 4,
            }}
          >
            Dhikr
          </Text>
          <Text style={{ fontSize: 13, color: Colors.charcoalMuted }}>
            {todayTotal} total today
          </Text>
        </Animated.View>

        {/* Dhikr selector toggle */}
        <Pressable
          onPress={() => setShowSelector(!showSelector)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: Colors.sage,
              fontWeight: "600",
              marginRight: 4,
            }}
          >
            {showSelector ? "Hide options" : "Change dhikr"}
          </Text>
          {showSelector ? (
            <ChevronUp size={16} color={Colors.sage} />
          ) : (
            <ChevronDown size={16} color={Colors.sage} />
          )}
        </Pressable>

        {/* Dhikr selector */}
        {showSelector && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {DHIKR_PRESETS.map((option) => (
              <DhikrPill
                key={option.key}
                option={option}
                isSelected={selected.key === option.key}
                onPress={() => switchDhikr(option)}
              />
            ))}
          </ScrollView>
        )}

        {/* Counter area */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 380,
          }}
        >
          {/* Tap target with progress ring */}
          <Pressable onPress={handleTap}>
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ProgressRing progress={progress} />

              {/* Count display (centered over the ring) */}
              <View style={{ position: "absolute", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 56,
                    fontWeight: "300",
                    color: Colors.charcoal,
                    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                  }}
                >
                  {ringCount}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.charcoalMuted,
                    marginTop: -2,
                  }}
                >
                  / {selected.target}
                </Text>
              </View>
            </Animated.View>
          </Pressable>

          {/* Current dhikr info */}
          <View style={{ alignItems: "center", marginTop: 28 }}>
            <Text
              style={{
                fontSize: 28,
                color: Colors.charcoal,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              {selected.arabic}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: Colors.sage,
                fontWeight: "600",
                marginBottom: 4,
              }}
            >
              {selected.transliteration}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.charcoalMuted,
                fontStyle: "italic",
              }}
            >
              {selected.translation}
            </Text>
          </View>

          {/* Completion message */}
          {isComplete && (
            <View
              style={{
                marginTop: 20,
                backgroundColor: "rgba(135,169,107,0.1)",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.sage,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                ✨ Target reached — keep going or switch dhikr
              </Text>
            </View>
          )}
        </View>

        {/* Reset button */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12 }}>
          <Pressable
            onPress={handleReset}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 12,
            }}
          >
            <RotateCcw size={16} color={Colors.charcoalMuted} />
            <Text style={{ color: Colors.charcoalMuted, fontSize: 14, marginLeft: 6 }}>
              Reset counter
            </Text>
          </Pressable>
        </View>

        {/* ── History ──────────────────────────── */}
        {user && (
          <View style={{ marginTop: 28, paddingHorizontal: 4 }}>
            {/* Divider + toggle */}
            <Pressable
              onPress={() => setShowHistory(!showHistory)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(135,169,107,0.1)" }} />
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 6 }}>
                <History size={14} color={Colors.charcoalMuted} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: Colors.charcoalMuted,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  Past 7 Days
                </Text>
                {showHistory ? (
                  <ChevronUp size={14} color={Colors.charcoalMuted} />
                ) : (
                  <ChevronDown size={14} color={Colors.charcoalMuted} />
                )}
              </View>
              <View style={{ flex: 1, height: 1, backgroundColor: "rgba(135,169,107,0.1)" }} />
            </Pressable>

            {showHistory && (
              <View style={{ marginTop: 16, gap: 8 }}>
                {history.map((day) => {
                  const isToday = day.date === getTodayLocal();
                  const isExpanded = expandedDay === day.date;

                  if (day.total === 0 && !isToday) return null;

                  return (
                    <Pressable
                      key={day.date}
                      onPress={() =>
                        setExpandedDay(isExpanded ? null : day.date)
                      }
                    >
                      <View
                        style={{
                          backgroundColor: isToday
                            ? "rgba(135,169,107,0.06)"
                            : "white",
                          borderRadius: 16,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: isToday
                            ? "rgba(135,169,107,0.15)"
                            : "rgba(135,169,107,0.06)",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: isToday ? "700" : "500",
                              color: isToday
                                ? Colors.sage
                                : Colors.charcoal,
                            }}
                          >
                            {isToday
                              ? "Today"
                              : new Date(
                                  day.date + "T12:00:00"
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <View
                              style={{
                                backgroundColor: isToday
                                  ? Colors.sage
                                  : "rgba(135,169,107,0.12)",
                                borderRadius: 10,
                                paddingVertical: 3,
                                paddingHorizontal: 10,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "700",
                                  color: isToday ? "white" : Colors.sage,
                                }}
                              >
                                {day.total}
                              </Text>
                            </View>
                            {day.breakdown.length > 0 && (
                              isExpanded ? (
                                <ChevronUp size={16} color={Colors.charcoalMuted} />
                              ) : (
                                <ChevronDown size={16} color={Colors.charcoalMuted} />
                              )
                            )}
                          </View>
                        </View>

                        {/* Breakdown */}
                        {isExpanded && day.breakdown.length > 0 && (
                          <View style={{ marginTop: 12, gap: 8 }}>
                            {day.breakdown.map((item) => (
                              <View
                                key={item.key}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 13,
                                    color: Colors.charcoal,
                                    flex: 1,
                                  }}
                                >
                                  {item.transliteration}
                                </Text>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  {/* Mini progress bar */}
                                  <View
                                    style={{
                                      width: 60,
                                      height: 4,
                                      borderRadius: 2,
                                      backgroundColor: "rgba(135,169,107,0.1)",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <View
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          (item.count /
                                            (DHIKR_PRESETS.find(
                                              (p) => p.key === item.key
                                            )?.target || 33)) *
                                            100
                                        )}%`,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: Colors.sage,
                                      }}
                                    />
                                  </View>
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      fontWeight: "600",
                                      color: Colors.sage,
                                      minWidth: 28,
                                      textAlign: "right",
                                    }}
                                  >
                                    {item.count}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}