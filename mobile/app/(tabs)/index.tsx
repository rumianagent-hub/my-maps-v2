import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import PostCard from "../../components/PostCard";
import type { PostWithAuthor } from "../../lib/types";
import { colors } from "../../lib/theme";

export default function HomeScreen() {
  const { user, profile, loading: authLoading, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPosts();
  }, [user, tab]);

  const loadPosts = async () => {
    setLoading(true);
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
  };

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  // Landing / sign in
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyMaps</Text>
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "foryou" && styles.tabBtnActive]}
          onPress={() => setTab("foryou")}
        >
          <Text style={[styles.tabText, tab === "foryou" && styles.tabTextActive]}>For You</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "following" && styles.tabBtnActive]}
          onPress={() => setTab("following")}
        >
          <Text style={[styles.tabText, tab === "following" && styles.tabTextActive]}>Following</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.indigo} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>{tab === "following" ? "👀" : "🍽️"}</Text>
          <Text style={styles.emptyText}>
            {tab === "following" ? "No posts from people you follow yet." : "No posts yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} showAuthor />}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          onRefresh={loadPosts}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: colors.text },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  tabBtnActive: { backgroundColor: colors.indigoDim },
  tabText: { fontSize: 14, fontWeight: "500", color: colors.textMuted },
  tabTextActive: { color: colors.indigo },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  landing: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  landingEmoji: { fontSize: 64, marginBottom: 24 },
  landingTitle: { fontSize: 36, fontWeight: "bold", color: colors.text, textAlign: "center", lineHeight: 44 },
  landingSubtitle: { color: colors.textSecondary, fontSize: 16, textAlign: "center", marginTop: 16, lineHeight: 24 },
  googleBtn: {
    marginTop: 32,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  googleBtnText: { color: "#1a1a1a", fontSize: 16, fontWeight: "600" },
});
