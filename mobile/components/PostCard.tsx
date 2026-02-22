import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import type { PostWithAuthor } from "../lib/types";
import { colors, radii, fonts } from "../lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PostCardProps {
  post: PostWithAuthor;
  showAuthor?: boolean;
  compact?: boolean;
}

export default function PostCard({ post, showAuthor = false, compact = false }: PostCardProps) {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handlePress = () => {
    router.push(`/post?id=${post.id}`);
  };

  const handleAuthorPress = () => {
    if (post.author_username) {
      router.push(`/user?id=${post.user_id}`);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} activeOpacity={0.7} onPress={handlePress}>
        {post.photo_urls.length > 0 && (
          <Image source={{ uri: post.photo_urls[0] }} style={styles.compactImage} />
        )}
        <View style={styles.compactContent}>
          <Text style={styles.compactPlaceName} numberOfLines={1}>{post.place_name}</Text>
          {post.rating > 0 && (
            <Text style={styles.compactRating}>{"★".repeat(post.rating)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={handlePress}>
      {post.photo_urls.length > 0 && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.photo_urls[0] }} style={styles.image} />
          {/* Rating badge */}
          {post.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{"★".repeat(post.rating)}</Text>
            </View>
          )}
          {/* Author overlay */}
          {showAuthor && post.author_name && (
            <TouchableOpacity style={styles.authorOverlay} onPress={handleAuthorPress} activeOpacity={0.7}>
              {post.author_photo ? (
                <Image source={{ uri: post.author_photo }} style={styles.authorAvatar} />
              ) : (
                <View style={[styles.authorAvatar, { backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ fontSize: 10, color: colors.text }}>👤</Text>
                </View>
              )}
              <Text style={styles.authorName}>{post.author_username || post.author_name}</Text>
            </TouchableOpacity>
          )}
          {/* Photo count */}
          {post.photo_urls.length > 1 && (
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>{post.photo_urls.length}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.placeName} numberOfLines={1}>{post.place_name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.locationText} numberOfLines={1}>
            {post.city || post.place_address || "Unknown location"}
          </Text>
          <Text style={styles.dateText}>{formatDate(post.visited_at)}</Text>
        </View>
        {post.caption ? (
          <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>
        ) : null}
        {post.tags.length > 0 && (
          <View style={styles.tags}>
            {post.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {post.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{post.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  ratingText: {
    color: colors.amber,
    fontSize: fonts.sizes.caption1,
    fontWeight: fonts.weights.semibold,
    letterSpacing: 1,
  },
  authorOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  authorName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: fonts.sizes.caption1,
    fontWeight: fonts.weights.medium,
  },
  photoCount: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  photoCountText: {
    color: colors.white,
    fontSize: fonts.sizes.caption2,
    fontWeight: fonts.weights.semibold,
  },
  content: {
    padding: 14,
  },
  placeName: {
    color: colors.text,
    fontSize: fonts.sizes.headline,
    fontWeight: fonts.weights.semibold,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    flex: 1,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: fonts.sizes.caption1,
    marginLeft: 8,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.subheadline,
    lineHeight: 20,
    marginTop: 8,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    alignItems: "center",
  },
  tag: {
    backgroundColor: colors.indigoDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  tagText: {
    color: colors.indigo,
    fontSize: fonts.sizes.caption1,
    fontWeight: fonts.weights.medium,
  },
  moreTagsText: {
    color: colors.textMuted,
    fontSize: fonts.sizes.caption1,
  },
  // Compact styles (for grid)
  compactCard: {
    flex: 1,
    margin: 1,
    aspectRatio: 1,
    backgroundColor: colors.bgCard,
    overflow: "hidden",
  },
  compactImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  compactContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  compactPlaceName: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fonts.weights.semibold,
  },
  compactRating: {
    color: colors.amber,
    fontSize: 8,
    letterSpacing: 1,
  },
});
