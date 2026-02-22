import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import type { PostWithAuthor } from "../lib/types";
import { colors } from "../lib/theme";

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("posts_with_author")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setPost(data as PostWithAuthor);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 40 }}>Post not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView showsVerticalScrollIndicator={false}>
        {post.photo_urls.length > 0 && (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {post.photo_urls.map((url, i) => (
              <Image key={i} source={{ uri: url }} style={styles.photo} />
            ))}
          </ScrollView>
        )}
        <View style={styles.content}>
          <View style={styles.authorRow}>
            {post.author_photo ? (
              <Image source={{ uri: post.author_photo }} style={styles.authorAvatar} />
            ) : null}
            <View>
              <Text style={styles.authorName}>{post.author_name}</Text>
              <Text style={styles.authorUsername}>@{post.author_username}</Text>
            </View>
          </View>

          <Text style={styles.placeName}>{post.place_name}</Text>
          <Text style={styles.location}>📍 {post.city || post.place_address}</Text>

          {post.rating > 0 && <Text style={styles.rating}>⭐ {post.rating}/5</Text>}
          {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

          <Text style={styles.date}>
            Visited {new Date(post.visited_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Text>

          {post.tags.length > 0 && (
            <View style={styles.tags}>
              {post.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  backBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  backText: { color: colors.indigo, fontSize: 16, fontWeight: "500" },
  photo: { width: 400, height: 300, resizeMode: "cover" },
  content: { padding: 16 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20 },
  authorName: { color: colors.text, fontSize: 16, fontWeight: "600" },
  authorUsername: { color: colors.textMuted, fontSize: 13 },
  placeName: { color: colors.text, fontSize: 24, fontWeight: "bold" },
  location: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  rating: { color: colors.amber, fontSize: 16, fontWeight: "600", marginTop: 12 },
  caption: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 12 },
  date: { color: colors.textMuted, fontSize: 13, marginTop: 16 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: { backgroundColor: colors.indigoDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { color: colors.indigo, fontSize: 12, fontWeight: "500" },
});
