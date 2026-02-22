import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import PostCard from "../components/PostCard";
import type { PostWithAuthor, UserProfile } from "../lib/types";
import { colors, fonts, spacing, radii } from "../lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 4) / 3;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!refreshing) setLoading(true);
    // Load profile
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    setProfile(userData as UserProfile);

    // Load posts
    const { data: postsData } = await supabase
      .from("posts_with_author")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setPosts((postsData as PostWithAuthor[]) || []);

    // Check follow status
    if (user && id !== user.id) {
      const { data: followData } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", id)
        .maybeSingle();
      setIsFollowing(!!followData);
    }

    setLoading(false);
    setRefreshing(false);
  };

  const toggleFollow = async () => {
    if (!user || !id) return;
    setFollowLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (isFollowing) {
        await supabase.rpc("unfollow_user", { target_user_id: id });
        setIsFollowing(false);
        if (profile) setProfile({ ...profile, follower_count: Math.max(0, profile.follower_count - 1) });
      } else {
        await supabase.rpc("follow_user", { target_user_id: id });
        setIsFollowing(true);
        if (profile) setProfile({ ...profile, follower_count: profile.follower_count + 1 });
      }
    } catch (e) {
      console.error(e);
    }
    setFollowLoading(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUser();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted }}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = user?.id === id;

  const header = (
    <View>
      <View style={styles.profileHeader}>
        {profile.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
        )}
        <Text style={styles.displayName}>{profile.display_name}</Text>
        {profile.username && <Text style={styles.username}>@{profile.username}</Text>}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.post_count}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity
            style={styles.stat}
            onPress={() => router.push(`/followers?id=${id}&tab=followers`)}
          >
            <Text style={styles.statNum}>{profile.follower_count}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stat}
            onPress={() => router.push(`/followers?id=${id}&tab=following`)}
          >
            <Text style={styles.statNum}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={toggleFollow}
            disabled={followLoading}
            activeOpacity={0.7}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? colors.text : colors.white} />
            ) : (
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{profile.display_name}</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={renderGridItem}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🍽️</Text>
            <Text style={{ color: colors.textMuted }}>No posts yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fonts.sizes.headline,
    fontWeight: fonts.weights.semibold,
    flex: 1,
    textAlign: "center",
  },
  backBtn: { width: 60, paddingVertical: 4 },
  backText: { color: colors.indigo, fontSize: fonts.sizes.body, fontWeight: fonts.weights.medium },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: colors.bgSecondary, justifyContent: "center", alignItems: "center" },
  displayName: { fontSize: fonts.sizes.title2, fontWeight: fonts.weights.bold, color: colors.text },
  username: { fontSize: fonts.sizes.subheadline, color: colors.textMuted, marginTop: 2 },
  bio: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.subheadline,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  statsRow: { flexDirection: "row", gap: 36, marginTop: 20 },
  stat: { alignItems: "center" },
  statNum: { fontSize: fonts.sizes.title3, fontWeight: fonts.weights.bold, color: colors.text },
  statLabel: { fontSize: fonts.sizes.caption1, color: colors.textMuted, marginTop: 2 },
  followBtn: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.indigo,
  },
  followBtnActive: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnText: {
    color: colors.white,
    fontSize: fonts.sizes.subheadline,
    fontWeight: fonts.weights.semibold,
  },
  followBtnTextActive: {
    color: colors.text,
  },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, padding: 1 },
  gridImage: { width: "100%", height: "100%" },
  emptyState: { alignItems: "center", paddingTop: 40 },
});
