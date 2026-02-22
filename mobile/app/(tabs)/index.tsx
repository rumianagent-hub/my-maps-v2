import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import PostCard from "../../components/PostCard";
import SegmentedControl from "../../components/SegmentedControl";
import type { PostWithAuthor } from "../../lib/types";
import { colors, fonts, spacing } from "../../lib/theme";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user, profile, loading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tab = tabIndex === 0 ? "foryou" : "following";

  useEffect(() => {
    if (!user) return;
    loadPosts();
  }, [user, tab]);

  const loadPosts = async () => {
    if (!refreshing) setLoading(true);
    try {
      if (tab === "following") {
        const { data } = await supabase.rpc("get_feed", { page_size: 20, page_offset: 0 });
        setPosts((data as PostWithAuthor[]) || []);
      } else {
        const { data } = await supabase
          .from("posts_with_author")
          .select("*")
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(20);
        setPosts((data as PostWithAuthor[]) || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [tab]);

  // Check onboarding
  useEffect(() => {
    if (user && profile && !profile.onboarded) {
      router.replace("/setup");
    }
  }, [user, profile]);

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
        <View style={styles.landing}>
          <Text style={styles.landingEmoji}>🍽️</Text>
          <Text style={styles.landingTitle}>Your restaurants.{"\n"}Your map.</Text>
          <Text style={styles.landingSubtitle}>
            Track every restaurant you visit, share your favorites, and discover new spots from friends.
          </Text>
          <TouchableOpacity style={styles.googleBtn} onPress={signInWithGoogle} activeOpacity={0.8}>
            <Text style={styles.googleBtnText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyMaps</Text>
      </View>
      <View style={styles.segmentWrapper}>
        <SegmentedControl
          segments={["For You", "Following"]}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.indigo} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} showAuthor />}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.indigo}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{tab === "following" ? "👀" : "🍽️"}</Text>
              <Text style={styles.emptyTitle}>
                {tab === "following" ? "No posts yet" : "No posts yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === "following"
                  ? "Follow some people to see their posts here"
                  : "Be the first to share a restaurant!"}
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.sizes.largeTitle,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },
  segmentWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    color: colors.text,
    fontSize: fonts.sizes.title3,
    fontWeight: fonts.weights.semibold,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fonts.sizes.subheadline,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  // Landing
  landing: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  landingEmoji: { fontSize: 72, marginBottom: 24 },
  landingTitle: {
    fontSize: fonts.sizes.largeTitle,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    textAlign: "center",
    lineHeight: 42,
  },
  landingSubtitle: {
    color: colors.textMuted,
    fontSize: fonts.sizes.body,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  googleBtn: {
    marginTop: 32,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  googleBtnText: {
    color: "#1a1a1a",
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.semibold,
  },
});
