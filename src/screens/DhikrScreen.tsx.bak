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

/* ── Circular progress ring ────────────────────── */

const ProgressRing = ({
  progress,
  size = 260,
  strokeWidth = 6,
}: {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size }}>
      {/* Background ring */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "rgba(135,169,107,0.08)",
        }}
      />
      {/* We'll use a simple View-based approach since SVG isn't available */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: Colors.sage,
          borderTopColor:
            progress > 0.75
              ? Colors.sage
              : "transparent",
          borderRightColor:
            progress > 0.5
              ? Colors.sage
              : "transparent",
          borderBottomColor:
            progress > 0.25
              ? Colors.sage
              : "transparent",
          borderLeftColor:
            progress > 0
              ? Colors.sage
              : "transparent",
          opacity: 0.6,
          transform: [{ rotate: "-90deg" }],
        }}
      />
    </View>
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
      backgroundColor: isSelected
        ? "rgba(135,169,107,0.2)"
        : "white",
      borderWidth: 1.5,
      borderColor: isSelected
        ? Colors.sage
        : "rgba(135,169,107,0.08)",
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
  const [count, setCount] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [showSelector, setShowSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  const progress = count / selected.target;
  const isComplete = count >= selected.target;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load today's count for the selected dhikr
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

      if (data) {
        setCount(data.count);
      } else {
        setCount(0);
      }

      // Also load total across all dhikr for today
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
      setCount(0);
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

      // Group by date
      const dayMap: Record<
        string,
        { key: string; count: number }[]
      > = {};
      for (const row of data) {
        if (!dayMap[row.date]) dayMap[row.date] = [];
        dayMap[row.date].push({
          key: row.dhikr_key,
          count: row.count,
        });
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
    const newCount = count + 1;
    setCount(newCount);
    setTodayTotal((prev) => prev + 1);

    // Haptic feedback
    Vibration.vibrate(10);

    // Pulse animation
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

    // Stronger feedback at target
    if (newCount === selected.target) {
      Vibration.vibrate([0, 100, 50, 100]);
    }

    // Save to Supabase
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
            .update({ count: newCount })
            .eq("id", existing.id);
        } else {
          await supabase.from("dhikr_logs").insert({
            user_id: user.id,
            dhikr_key: selected.key,
            count: newCount,
            date: today,
          });
        }
      } catch (err) {
        console.warn("Dhikr save error:", err);
      }
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const switchDhikr = (option: DhikrOption) => {
    setSelected(option);
    setCount(0);
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
          <Text
            style={{
              fontSize: 13,
              color: Colors.charcoalMuted,
            }}
          >
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
              <View
                style={{
                  position: "absolute",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 56,
                    fontWeight: "300",
                    color: Colors.charcoal,
                    fontFamily:
                      Platform.OS === "ios" ? "Georgia" : "serif",
                  }}
                >
                  {count}
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
            <Text
              style={{
                color: Colors.charcoalMuted,
                fontSize: 14,
                marginLeft: 6,
              }}
            >
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
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "rgba(135,169,107,0.12)",
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <History size={14} color={Colors.charcoalMuted} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
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
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "rgba(135,169,107,0.12)",
                  }}
                />
              </View>
            </Pressable>

            {showHistory && (
              <View>
                {history.map((day) => {
                  const dateObj = new Date(day.date + "T12:00:00");
                  const isExpanded = expandedDay === day.date;
                  const isCurrentDay = day.date === getTodayLocal();
                  const dayLabel = isCurrentDay
                    ? "Today"
                    : dateObj.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });

                  return (
                    <View key={day.date} style={{ marginBottom: 8 }}>
                      <Pressable
                        onPress={() =>
                          setExpandedDay(isExpanded ? null : day.date)
                        }
                      >
                        <View
                          style={{
                            backgroundColor: "white",
                            borderRadius: 14,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: isCurrentDay
                              ? "rgba(135,169,107,0.2)"
                              : "rgba(135,169,107,0.08)",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: isCurrentDay ? "700" : "600",
                                color: isCurrentDay
                                  ? Colors.sage
                                  : Colors.charcoal,
                              }}
                            >
                              {dayLabel}
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {day.total > 0 ? (
                              <View
                                style={{
                                  backgroundColor: "rgba(135,169,107,0.1)",
                                  borderRadius: 8,
                                  paddingVertical: 3,
                                  paddingHorizontal: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "700",
                                    color: Colors.sage,
                                  }}
                                >
                                  {day.total}
                                </Text>
                              </View>
                            ) : (
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: Colors.charcoalMuted,
                                  fontStyle: "italic",
                                }}
                              >
                                —
                              </Text>
                            )}
                            {day.breakdown.length > 0 && (
                              isExpanded ? (
                                <ChevronUp
                                  size={14}
                                  color={Colors.charcoalMuted}
                                />
                              ) : (
                                <ChevronDown
                                  size={14}
                                  color={Colors.charcoalMuted}
                                />
                              )
                            )}
                          </View>
                        </View>
                      </Pressable>

                      {/* Expanded breakdown */}
                      {isExpanded && day.breakdown.length > 0 && (
                        <View
                          style={{
                            backgroundColor: "rgba(135,169,107,0.04)",
                            borderRadius: 12,
                            marginTop: 4,
                            padding: 12,
                            gap: 8,
                          }}
                        >
                          {day.breakdown.map((item) => (
                            <View
                              key={item.key}
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  color: Colors.charcoal,
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
                                      width: `${Math.min(100, (item.count / (DHIKR_PRESETS.find((p) => p.key === item.key)?.target || 33)) * 100)}%`,
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
                  );
                })}

                {/* Total for the week */}
                {history.length > 0 && (
                  <View
                    style={{
                      alignItems: "center",
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: "rgba(135,169,107,0.1)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: Colors.charcoalMuted,
                      }}
                    >
                      Week total:{" "}
                      <Text
                        style={{
                          fontWeight: "700",
                          color: Colors.sage,
                        }}
                      >
                        {history.reduce((sum, d) => sum + d.total, 0)}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}