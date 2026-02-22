import React, { useState, useEffect } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import SegmentedControl from "../components/SegmentedControl";
import type { FollowUser } from "../lib/types";
import { colors, fonts, spacing, radii } from "../lib/theme";

export default function FollowersScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(initialTab === "following" ? 1 : 0);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  const isFollowersTab = tabIndex === 0;

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);

    // Load followers
    const { data: followersData } = await supabase
      .from("follows")
      .select("follower_id, users!follows_follower_id_fkey(id, username, display_name, photo_url, bio, follower_count, following_count)")
      .eq("following_id", id);

    const fList = (followersData || []).map((f: any) => f.users).filter(Boolean) as FollowUser[];
    setFollowers(fList);

    // Load following
    const { data: followingData } = await supabase
      .from("follows")
      .select("following_id, users!follows_following_id_fkey(id, username, display_name, photo_url, bio, follower_count, following_count)")
      .eq("follower_id", id);

    const gList = (followingData || []).map((f: any) => f.users).filter(Boolean) as FollowUser[];
    setFollowing(gList);

    // Check which ones current user follows
    if (user) {
      const { data: myFollowing } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      setFollowingSet(new Set((myFollowing || []).map((f: any) => f.following_id)));
    }

    setLoading(false);
  };

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isCurrentlyFollowing = followingSet.has(targetId);
    try {
      if (isCurrentlyFollowing) {
        await supabase.rpc("unfollow_user", { target_user_id: targetId });
        setFollowingSet((prev) => { const s = new Set(prev); s.delete(targetId); return s; });
      } else {
        await supabase.rpc("follow_user", { target_user_id: targetId });
        setFollowingSet((prev) => new Set(prev).add(targetId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderUser = ({ item }: { item: FollowUser }) => {
    const isMe = user?.id === item.id;
    const amFollowing = followingSet.has(item.id);

    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => router.push(`/user?id=${item.id}`)}
        activeOpacity={0.7}
      >
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ fontSize: 18 }}>👤</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.displayName} numberOfLines={1}>{item.display_name}</Text>
          {item.username && <Text style={styles.username}>@{item.username}</Text>}
        </View>
        {!isMe && (
          <TouchableOpacity
            style={[styles.followBtn, amFollowing && styles.followBtnActive]}
            onPress={() => toggleFollow(item.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.followBtnText, amFollowing && styles.followBtnTextActive]}>
              {amFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const data = isFollowersTab ? followers : following;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentWrapper}>
        <SegmentedControl
          segments={["Followers", "Following"]}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.indigo} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>
                {isFollowersTab ? "👥" : "🔍"}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.body }}>
                {isFollowersTab ? "No followers yet" : "Not following anyone yet"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: colors.indigo, fontSize: fonts.sizes.body, fontWeight: fonts.weights.medium },
  segmentWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  userInfo: { flex: 1, marginLeft: 12 },
  displayName: { color: colors.text, fontSize: fonts.sizes.body, fontWeight: fonts.weights.semibold },
  username: { color: colors.textMuted, fontSize: fonts.sizes.footnote, marginTop: 1 },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radii.sm,
    backgroundColor: colors.indigo,
  },
  followBtnActive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnText: {
    color: colors.white,
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.semibold,
  },
  followBtnTextActive: {
    color: colors.text,
  },
  empty: { alignItems: "center", paddingTop: 60 },
});
