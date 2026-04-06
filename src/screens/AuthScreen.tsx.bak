// screens/AuthScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, User, Eye, EyeOff, X } from "lucide-react-native";
import { Colors } from "../lib/theme";
import { useAuth } from "../lib/AuthContext";

type Mode = "signin" | "signup";

export default function AuthScreen({
  navigation,
}: {
  navigation: any;
}) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, name.trim());
        Alert.alert(
          "Account created",
          "You can now sign in with your email and password."
        );
        setMode("signin");
      } else {
        await signIn(email.trim(), password);
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingVertical: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {[5, 7, 5].map((size, i) => (
                <View
                  key={i}
                  style={{
                    width: size,
                    height: size,
                    backgroundColor:
                      i === 1
                        ? "rgba(135,169,107,0.7)"
                        : "rgba(135,169,107,0.4)",
                    transform: [{ rotate: "45deg" }],
                  }}
                />
              ))}
            </View>
            <Text
              style={{
                fontSize: 28,
                color: Colors.charcoal,
                fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.charcoalMuted,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {mode === "signin"
                ? "Sign in to continue your journey"
                : "Begin your spiritual journey"}
            </Text>
          </View>

          {/* Form fields */}
          <View style={{ gap: 14 }}>
            {mode === "signup" && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "white",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  borderWidth: 1,
                  borderColor: "rgba(135,169,107,0.1)",
                }}
              >
                <User size={18} color={Colors.charcoalMuted} />
                <TextInput
                  placeholder="Your name"
                  placeholderTextColor={Colors.charcoalMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    fontSize: 15,
                    color: Colors.charcoal,
                  }}
                />
              </View>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "white",
                borderRadius: 14,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: "rgba(135,169,107,0.1)",
              }}
            >
              <Mail size={18} color={Colors.charcoalMuted} />
              <TextInput
                placeholder="Email"
                placeholderTextColor={Colors.charcoalMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 15,
                  color: Colors.charcoal,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "white",
                borderRadius: 14,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: "rgba(135,169,107,0.1)",
              }}
            >
              <Lock size={18} color={Colors.charcoalMuted} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={Colors.charcoalMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 15,
                  color: Colors.charcoal,
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Colors.charcoalMuted} />
                ) : (
                  <Eye size={18} color={Colors.charcoalMuted} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
          >
            <View
              style={{
                backgroundColor: Colors.sage,
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: "center",
                marginTop: 24,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "700" }}
                >
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </View>
          </Pressable>

          {/* Toggle mode */}
          <Pressable
            onPress={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setPassword("");
            }}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, color: Colors.charcoalMuted }}>
              {mode === "signin"
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={{ color: Colors.sage, fontWeight: "600" }}>
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}