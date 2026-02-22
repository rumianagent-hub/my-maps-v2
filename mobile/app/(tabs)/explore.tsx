import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, ScrollView, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { supabase } from "../../lib/supabase";
import PostCard from "../../components/PostCard";
import type { PostWithAuthor, UserProfile } from "../../lib/types";
import { colors, fonts, spacing, radii } from "../../lib/theme";
import { useRouter } from "expo-router";

type SearchTab = "all" | "restaurants" | "people" | "tags";

export default function ExploreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchTab, setSearchTab] = useState<SearchTab>("all");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExplore();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      if (query.trim().length === 0) loadExplore();
      return;
    }
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query, searchTab]);

  const loadExplore = async () => {
    if (!refreshing) setLoading(true);
    const { data } = await supabase
      .from("posts_with_author")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(30);
    setPosts((data as PostWithAuthor[]) || []);
    setUsers([]);
    setLoading(false);
    setRefreshing(false);
  };

  const search = async (q: string) => {
    setLoading(true);
    const clean = q.toLowerCase().trim();

    if (searchTab === "people" || searchTab === "all") {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .or(`display_name.ilike.%${clean}%,username.ilike.%${clean}%`)
        .limit(10);
      setUsers((userData as UserProfile[]) || []);
    } else {
      setUsers([]);
    }

    if (searchTab !== "people") {
      let postQuery = supabase
        .from("posts_with_author")
        .select("*")
        .eq("visibility", "public");

      if (searchTab === "restaurants") {
        postQuery = postQuery.or(`place_name.ilike.%${clean}%,city.ilike.%${clean}%`);
      } else if (searchTab === "tags") {
        postQuery = postQuery.contains("tags", [clean]);
      } else {
        postQuery = postQuery.or(`place_name.ilike.%${clean}%,city.ilike.%${clean}%,caption.ilike.%${clean}%`);
      }

      const { data } = await postQuery.order("created_at", { ascending: false }).limit(30);
      setPosts((data as PostWithAuthor[]) || []);
    } else {
      setPosts([]);
    }

    setLoading(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExplore();
  }, []);

  const tabs: { key: SearchTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "restaurants", label: "Restaurants" },
    { key: "people", label: "People" },
    { key: "tags", label: "Tags" },
  ];

  const renderUserCard = (user: UserProfile) => (
    <TouchableOpacity
      key={user.id}
      style={styles.userCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/user?id=${user.id}`)}
    >
      {user.photo_url ? (
        <Image source={{ uri: user.photo_url }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, { backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ fontSize: 20 }}>👤</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userDisplayName} numberOfLines={1}>{user.display_name}</Text>
        {user.username && <Text style={styles.userUsername}>@{user.username}</Text>}
      </View>
      <Text style={styles.userFollowers}>{user.follower_count} followers</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, people, tags..."
            placeholderTextColor={colors.textPlaceholder}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab pills */}
      {query.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabPills}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8 }}
        >
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.pill, searchTab === t.key && styles.pillActive]}
              onPress={() => setSearchTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, searchTab === t.key && styles.pillTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.indigo} />
        </View>
      ) : (
        <FlatList
          data={searchTab === "people" ? [] : posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} showAuthor />}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} />
          }
          ListHeaderComponent={
            users.length > 0 ? (
              <View style={styles.usersSection}>
                <Text style={styles.sectionTitle}>People</Text>
                {users.map(renderUserCard)}
                {searchTab !== "people" && posts.length > 0 && (
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Posts</Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            users.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>
                  {query ? "No results found" : "Discover restaurants and people"}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(118,118,128,0.24)",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fonts.sizes.body,
    paddingVertical: 10,
  },
  clearBtn: {
    color: colors.textMuted,
    fontSize: 16,
    padding: 4,
  },
  tabPills: {
    paddingBottom: spacing.sm,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: "rgba(118,118,128,0.24)",
  },
  pillActive: {
    backgroundColor: colors.indigo,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.medium,
  },
  pillTextActive: {
    color: colors.white,
  },
  usersSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 8,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userDisplayName: {
    color: colors.text,
    fontSize: fonts.sizes.body,
    fontWeight: fonts.weights.semibold,
  },
  userUsername: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    marginTop: 1,
  },
  userFollowers: {
    color: colors.textMuted,
    fontSize: fonts.sizes.caption1,
  },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: fonts.sizes.body },
});
