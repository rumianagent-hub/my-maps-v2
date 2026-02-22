import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";
import { colors, fonts, spacing, radii } from "../lib/theme";
import { useRouter } from "expo-router";

export default function SetupScreen() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.onboarded) {
      router.replace("/(tabs)");
    }
  }, [profile?.onboarded]);

  useEffect(() => {
    if (username.trim().length < 3) {
      setAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("username", clean)
        .maybeSingle();
      setAvailable(!data || data.id === user?.id);
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async () => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanUsername.length < 3) return;
    if (available === false) return;

    setSaving(true);
    try {
      await updateProfile({
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        bio: bio.trim(),
        onboarded: true,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshProfile();
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Welcome to MyMaps</Text>
          <Text style={styles.subtitle}>Let's set up your profile</Text>

          <Text style={styles.label}>Username *</Text>
          <View style={styles.usernameRow}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={styles.usernameInput}
              value={username}
              onChangeText={setUsername}
              placeholder="yourname"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {checking && <ActivityIndicator size="small" color={colors.indigo} />}
            {!checking && available === true && <Text style={styles.checkmark}>✓</Text>}
            {!checking && available === false && <Text style={styles.cross}>✗</Text>}
          </View>
          {available === false && (
            <Text style={styles.errorText}>This username is taken</Text>
          )}

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your Name"
            placeholderTextColor={colors.textPlaceholder}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={colors.textPlaceholder}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (username.trim().length < 3 || available === false) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={saving || username.trim().length < 3 || available === false}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  emoji: { fontSize: 56, textAlign: "center", marginBottom: 16 },
  title: {
    fontSize: fonts.sizes.title1,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fonts.sizes.body,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  label: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 16,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingHorizontal: 14,
  },
  atSign: {
    color: colors.textMuted,
    fontSize: fonts.sizes.body,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    color: colors.text,
    fontSize: fonts.sizes.body,
    paddingVertical: 14,
  },
  checkmark: { color: colors.green, fontSize: 18, fontWeight: fonts.weights.bold },
  cross: { color: colors.red, fontSize: 18, fontWeight: fonts.weights.bold },
  errorText: { color: colors.red, fontSize: fonts.sizes.caption1, marginTop: 4 },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text,
    fontSize: fonts.sizes.body,
  },
  submitBtn: {
    backgroundColor: colors.indigo,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: "center",
    marginTop: 32,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: {
    color: colors.white,
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.semibold,
  },
});
