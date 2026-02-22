import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import PostCard from "../../components/PostCard";
import type { PostWithAuthor } from "../../lib/types";
import { colors } from "../../lib/theme";

export default function ProfileScreen() {
  const { user, profile, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadMyPosts();
  }, [user]);

  const loadMyPosts = async () => {
    setLoading(true);
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
          <Text style={{ fontSize: 48, marginBottom: 12 }}>👤</Text>
          <Text style={{ color: colors.textMuted, fontSize: 16, marginBottom: 20 }}>Sign in to view your profile</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={signInWithGoogle}>
            <Text style={styles.signInText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const header = (
    <View style={styles.profileHeader}>
      {profile?.photo_url ? (
        <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={{ fontSize: 32 }}>👤</Text>
        </View>
      )}
      <Text style={styles.displayName}>{profile?.display_name || "User"}</Text>
      {profile?.username && <Text style={styles.username}>@{profile.username}</Text>}
      {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      {profile?.home_city ? (
        <Text style={styles.city}>📍 {profile.home_city}</Text>
      ) : null}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{profile?.post_count || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{profile?.follower_count || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{profile?.following_count || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.indigo} style={{ marginTop: 40 }} />
          ) : (
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🍽️</Text>
              <Text style={{ color: colors.textMuted }}>No posts yet — start logging!</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  profileHeader: { alignItems: "center", paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: colors.bgSecondary, justifyContent: "center", alignItems: "center" },
  displayName: { fontSize: 22, fontWeight: "bold", color: colors.text },
  username: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  bio: { color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
  city: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  statsRow: { flexDirection: "row", gap: 32, marginTop: 16 },
  stat: { alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "bold", color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  logoutBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { color: colors.textSecondary, fontSize: 14 },
  signInBtn: { backgroundColor: colors.white, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  signInText: { color: "#1a1a1a", fontWeight: "600" },
});
