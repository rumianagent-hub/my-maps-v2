import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import PostCard from "../../components/PostCard";
import type { PostWithAuthor } from "../../lib/types";
import { colors } from "../../lib/theme";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExplore();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      loadExplore();
      return;
    }
    const timer = setTimeout(() => searchPosts(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const loadExplore = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts_with_author")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts((data as PostWithAuthor[]) || []);
    setLoading(false);
  };

  const searchPosts = async (q: string) => {
    setLoading(true);
    const clean = q.toLowerCase().trim();
    const { data } = await supabase
      .from("posts_with_author")
      .select("*")
      .eq("visibility", "public")
      .or(`place_name.ilike.%${clean}%,city.ilike.%${clean}%,caption.ilike.%${clean}%`)
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts((data as PostWithAuthor[]) || []);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants, cities, tags..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.indigo} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} showAuthor />}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No results found</Text>
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
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: colors.text },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 12 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
});
