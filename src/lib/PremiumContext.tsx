// lib/PremiumContext.tsx
// ─────────────────────────────────────────────────
// For now: uses Supabase profile + dev toggle.
// When ready: swap in RevenueCat (see comments below).
//
// DEV_MODE: flip premiumOverride to test both flows
// without a real subscription.
// ─────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";

/* ── Constants ─────────────────────────────────── */

const FREE_REFLECTIONS_PER_MONTH = 3;

// 🔧 DEV TOGGLE — set to true to test premium features
//    Set to false to test the free user flow
//    Set to null to use actual Supabase profile value
const DEV_PREMIUM_OVERRIDE: boolean | null = null;

/* ── Types ─────────────────────────────────────── */

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  reflectionsUsed: number;
  reflectionsLeft: number;
  canReflect: boolean;
  incrementReflection: () => Promise<void>;
  // Placeholder for RevenueCat — add these when ready:
  // packages: PurchasesPackage[];
  // purchase: (pkg: PurchasesPackage) => Promise<void>;
  // restore: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  loading: true,
  reflectionsUsed: 0,
  reflectionsLeft: FREE_REFLECTIONS_PER_MONTH,
  canReflect: true,
  incrementReflection: async () => {},
});

export const usePremium = () => useContext(PremiumContext);
export { FREE_REFLECTIONS_PER_MONTH };

/* ── Helper ────────────────────────────────────── */

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ── Provider ──────────────────────────────────── */

export function PremiumProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reflectionsUsed, setReflectionsUsed] = useState(0);

  const reflectionsLeft = Math.max(
    0,
    FREE_REFLECTIONS_PER_MONTH - reflectionsUsed
  );
  const canReflect = isPremium || reflectionsLeft > 0;

  /* ── Load premium status ───────────────────── */

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setReflectionsUsed(0);
      setLoading(false);
      return;
    }

    loadPremiumStatus();
    loadUsage();
  }, [user]);

  const loadPremiumStatus = async () => {
    // Dev override
    if (DEV_PREMIUM_OVERRIDE !== null) {
      setIsPremium(DEV_PREMIUM_OVERRIDE);
      setLoading(false);
      return;
    }

    if (!user) return;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      setIsPremium(data?.is_premium || false);
    } catch {
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  /* ── Load usage from Supabase ──────────────── */

  const loadUsage = async () => {
    if (!user) return;
    const month = getCurrentMonth();

    try {
      const { data } = await supabase
        .from("user_usage")
        .select("reflection_count")
        .eq("user_id", user.id)
        .eq("month", month)
        .single();

      setReflectionsUsed(data?.reflection_count || 0);
    } catch {
      setReflectionsUsed(0);
    }
  };

  /* ── Increment reflection count ────────────── */

  const incrementReflection = async () => {
    if (!user || isPremium) return;
    const month = getCurrentMonth();

    try {
      const { data: existing } = await supabase
        .from("user_usage")
        .select("reflection_count")
        .eq("user_id", user.id)
        .eq("month", month)
        .single();

      if (existing) {
        await supabase
          .from("user_usage")
          .update({
            reflection_count: existing.reflection_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("month", month);
      } else {
        await supabase.from("user_usage").insert({
          user_id: user.id,
          month,
          reflection_count: 1,
        });
      }

      setReflectionsUsed((prev) => prev + 1);
    } catch (err) {
      console.warn("Usage tracking error:", err);
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        loading,
        reflectionsUsed,
        reflectionsLeft,
        canReflect,
        incrementReflection,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}