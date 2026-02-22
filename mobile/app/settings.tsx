import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../lib/auth-context";
import { colors, fonts, spacing, radii } from "../lib/theme";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const { profile, updateProfile, logout } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState(profile?.username || "");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [homeCity, setHomeCity] = useState(profile?.home_city || "");
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || profile?.username || null,
        display_name: displayName.trim() || profile?.display_name || "User",
        bio: bio.trim(),
        home_city: homeCity.trim(),
        is_public: isPublic,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save");
    }
    setSaving(false);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.indigo} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile section */}
        <Text style={styles.sectionTitle}>PROFILE</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.fieldInput}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={styles.fieldInput}
              value={bio}
              onChangeText={setBio}
              placeholder="About you..."
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Home City</Text>
            <TextInput
              style={styles.fieldInput}
              value={homeCity}
              onChangeText={setHomeCity}
              placeholder="Toronto"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
        </View>

        {/* Privacy */}
        <Text style={styles.sectionTitle}>PRIVACY</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Public Profile</Text>
            <Switch
              value={isPublic}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsPublic(v);
              }}
              trackColor={{ false: colors.bgTertiary, true: colors.indigo }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={styles.switchHint}>
            {isPublic ? "Anyone can see your posts" : "Only followers can see your posts"}
          </Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { width: 60, paddingVertical: 4 },
  backText: { color: colors.indigo, fontSize: fonts.sizes.body, fontWeight: fonts.weights.medium },
  headerTitle: {
    color: colors.text,
    fontSize: fonts.sizes.headline,
    fontWeight: fonts.weights.semibold,
  },
  saveText: {
    color: colors.indigo,
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.semibold,
    width: 60,
    textAlign: "right",
  },
  scroll: { padding: spacing.md, paddingBottom: 100 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.medium,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: fonts.sizes.body,
    width: 110,
  },
  fieldInput: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fonts.sizes.body,
    textAlign: "right",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    color: colors.text,
    fontSize: fonts.sizes.body,
  },
  switchHint: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  signOutBtn: {
    marginTop: 32,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    color: colors.red,
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.medium,
  },
});
