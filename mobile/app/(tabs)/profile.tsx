import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Dimensions, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import PostCard from "../../components/PostCard";
import SegmentedControl from "../../components/SegmentedControl";
import type { PostWithAuthor } from "../../lib/types";
import { colors, fonts, spacing, radii } from "../../lib/theme";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 4) / 3;

export default function ProfileScreen() {
  const { user, profile, loading: authLoading, signInWithGoogle, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewIndex, setViewIndex] = useState(0); // 0=posts, 1=grid
  const [segIndex, setSegIndex] = useState(0); // 0=posts, 1=map

  useEffect(() => {
    if (!user) return;
    loadMyPosts();
  }, [user]);

  const loadMyPosts = async () => {
    if (!refreshing) setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*, users!inner(display_name, photo_url, username)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    const mapped = (data || []).map((p: any) => ({
      ...p,
      author_name: p.users?.display_name || "",
      author_photo: p.users?.photo_url || "",
      author_username: p.users?.username || "",
      users: undefined,
    })) as PostWithAuthor[];
    setPosts(mapped);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshProfile();
    loadMyPosts();
  }, [user]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          logout();
        },
      },
    ]);
  };

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>👤</Text>
          <Text style={styles.signInTitle}>Sign in to view your profile</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={signInWithGoogle} activeOpacity={0.8}>
            <Text style={styles.signInBtnText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderGridItem = ({ item }: { item: PostWithAuthor }) => (
    <TouchableOpacity
      style={styles.gridItem}
      activeOpacity={0.8}
      onPress={() => router.push(`/post?id=${item.id}`)}
    >
      {item.photo_urls.length > 0 ? (
        <Image source={{ uri: item.photo_urls[0] }} style={styles.gridImage} />
      ) : (
        <View style={[styles.gridImage, { backgroundColor: colors.bgSecondary, justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ fontSize: 24 }}>🍽️</Text>
        </View>
      )}
      {item.photo_urls.length > 1 && (
        <View style={styles.gridMulti}>
          <Text style={{ color: colors.white, fontSize: 10 }}>📷</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const header = (
    <View>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        {profile?.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
        )}
        <Text style={styles.displayName}>{profile?.display_name || "User"}</Text>
        {profile?.username && <Text style={styles.username}>@{profile.username}</Text>}
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {profile?.home_city ? (
          <Text style={styles.city}>📍 {profile.home_city}</Text>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile?.post_count || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity
            style={styles.stat}
            onPress={() => router.push(`/followers?id=${user.id}&tab=followers`)}
          >
            <Text style={styles.statNum}>{profile?.follower_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stat}
            onPress={() => router.push(`/followers?id=${user.id}&tab=following`)}
          >
            <Text style={styles.statNum}>{profile?.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segment control */}
      <View style={styles.segmentWrapper}>
        <SegmentedControl
          segments={["Grid", "List"]}
          selectedIndex={segIndex}
          onChange={(i) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSegIndex(i);
          }}
        />
      </View>
    </View>
  );

  const emptyComponent = loading ? (
    <ActivityIndicator size="large" color={colors.indigo} style={{ marginTop: 40 }} />
  ) : (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>🍽️</Text>
      <Text style={styles.emptyText}>No posts yet — start logging!</Text>
    </View>
  );

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} />
  );

  if (segIndex === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <FlatList
          key="grid"
          data={posts}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={renderGridItem}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={emptyComponent}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        key="list"
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListEmptyComponent={emptyComponent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.bgSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  displayName: {
    fontSize: fonts.sizes.title2,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  username: {
    fontSize: fonts.sizes.subheadline,
    color: colors.textMuted,
    marginTop: 2,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.subheadline,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  city: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 36,
    marginTop: 20,
  },
  stat: { alignItems: "center" },
  statNum: {
    fontSize: fonts.sizes.title3,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fonts.sizes.caption1,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    width: "100%",
    paddingHorizontal: 16,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
  },
  editBtnText: {
    color: colors.text,
    fontSize: fonts.sizes.subheadline,
    fontWeight: fonts.weights.semibold,
  },
  settingsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    padding: 1,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridMulti: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: { color: colors.textMuted, fontSize: fonts.sizes.subheadline },
  signInTitle: {
    color: colors.textMuted,
    fontSize: fonts.sizes.body,
    marginBottom: 20,
  },
  signInBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  signInBtnText: { color: "#1a1a1a", fontWeight: fonts.weights.semibold },
});
