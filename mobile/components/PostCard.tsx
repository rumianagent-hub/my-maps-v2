import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import type { PostWithAuthor } from "../lib/types";
import { colors } from "../lib/theme";

const { width } = Dimensions.get("window");

export default function PostCard({ post, showAuthor = false }: { post: PostWithAuthor; showAuthor?: boolean }) {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/post?id=${post.id}`)}
    >
      {post.photo_urls.length > 0 && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.photo_urls[0] }} style={styles.image} />
          <View style={styles.gradient} />
          {post.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {post.rating}</Text>
            </View>
          )}
          {showAuthor && post.author_name && (
            <View style={styles.authorOverlay}>
              {post.author_photo ? (
                <Image source={{ uri: post.author_photo }} style={styles.authorAvatar} />
              ) : null}
              <Text style={styles.authorName}>@{post.author_username}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.content}>
        {!post.photo_urls.length && showAuthor && post.author_name && (
          <View style={styles.authorRow}>
            {post.author_photo ? (
              <Image source={{ uri: post.author_photo }} style={{ width: 20, height: 20, borderRadius: 10 }} />
            ) : null}
            <Text style={styles.authorNameSmall}>@{post.author_username}</Text>
          </View>
        )}
        <Text style={styles.placeName} numberOfLines={1}>{post.place_name}</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>{post.city || post.place_address}</Text>
        </View>
        {post.caption ? <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text> : null}
        <Text style={styles.date}>📅 {formatDate(post.visited_at)}</Text>
        {post.tags.length > 0 && (
          <View style={styles.tags}>
            {post.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  imageContainer: { position: "relative" },
  image: { width: "100%", height: 220, resizeMode: "cover" },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: { color: colors.amber, fontSize: 12, fontWeight: "600" },
  authorOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorAvatar: { width: 24, height: 24, borderRadius: 12 },
  authorName: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "500" },
  content: { padding: 14 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  authorNameSmall: { color: colors.textMuted, fontSize: 12 },
  placeName: { color: colors.text, fontSize: 16, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationIcon: { fontSize: 13 },
  locationText: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  caption: { color: colors.textSecondary, fontSize: 14, marginTop: 8 },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: colors.indigoDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: { color: colors.indigo, fontSize: 12, fontWeight: "500" },
});
