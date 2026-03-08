import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { Colors } from "../lib/theme";

type Status = "idle" | "testing" | "connected" | "error";

export default function SupabaseTest() {
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState("");

  const testConnection = async () => {
    setStatus("testing");
    setDetail("");

    try {
      // 1. Basic client check — does the URL resolve?
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setStatus("error");
        setDetail(`Auth error: ${error.message}`);
        return;
      }

      // 2. If we get here, Supabase responded successfully
      setStatus("connected");
      setDetail(
        data.session
          ? `Signed in as ${data.session.user.email}`
          : "Connected — no active session (expected)"
      );
    } catch (err: any) {
      setStatus("error");
      setDetail(err.message || "Unknown error");
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const statusColors = {
    idle: Colors.charcoalMuted,
    testing: Colors.charcoalMuted,
    connected: "#22c55e",
    error: "#ef4444",
  };

  const statusLabels = {
    idle: "Not tested",
    testing: "Testing...",
    connected: "Connected",
    error: "Failed",
  };

  return (
    <View
      className="bg-white rounded-2xl p-4 mb-4 border border-sage/10"
      style={{ borderLeftWidth: 3, borderLeftColor: statusColors[status] }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text className="text-charcoal text-xs font-semibold tracking-widest uppercase">
          Supabase
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {status === "testing" && (
            <ActivityIndicator size="small" color={Colors.charcoalMuted} />
          )}
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusColors[status],
            }}
          />
          <Text style={{ color: statusColors[status], fontSize: 12, fontWeight: "600" }}>
            {statusLabels[status]}
          </Text>
        </View>
      </View>

      {detail ? (
        <Text className="text-charcoal-muted text-xs mt-2">{detail}</Text>
      ) : null}

      {status === "error" && (
        <Pressable
          onPress={testConnection}
          className="mt-3 rounded-lg py-2 items-center"
          style={{ backgroundColor: "rgba(135,169,107,0.1)" }}
        >
          <Text className="text-sage text-xs font-semibold">Retry</Text>
        </Pressable>
      )}
    </View>
  );
}
