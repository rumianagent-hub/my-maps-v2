import React, { useEffect, useState } from "react";
import {
  View, Text, Image, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Dimensions, Alert, Linking, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import type { PostWithAuthor } from "../lib/types";
import { colors, fonts, spacing, radii } from "../lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editTags, setEditTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("posts_with_author")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        const p = data as PostWithAuthor;
        setPost(p);
        if (p) {
          setEditCaption(p.caption);
          setEditRating(p.rating);
          setEditTags(p.tags.join(", "));
        }
        setLoading(false);
      });
  }, [id]);

  const isOwner = user && post && user.id === post.user_id;

  const openInMaps = () => {
    if (!post) return;
    const url = post.lat && post.lng
      ? `maps://maps.apple.com/?q=${encodeURIComponent(post.place_name)}&ll=${post.lat},${post.lng}`
      : `maps://maps.apple.com/?q=${encodeURIComponent(post.place_name)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(post.place_name)}`);
    });
  };

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure? This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          const { error } = await supabase.from("posts").delete().eq("id", post!.id);
          if (error) {
            Alert.alert("Error", error.message);
          } else {
            router.back();
          }
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!post) return;
    setSaving(true);
    const { error } = await supabase.from("posts").update({
      caption: editCaption.trim(),
      rating: editRating,
      tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
    }).eq("id", post.id);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPost({
        ...post,
        caption: editCaption.trim(),
        rating: editRating,
        tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setEditing(false);
    }
    setSaving(false);
  };

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    setPhotoIndex(Math.round(x / SCREEN_WIDTH));
  };

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.body }}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        {isOwner && !editing && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.headerAction}>
              <Text style={{ color: colors.indigo, fontSize: fonts.sizes.body }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerAction}>
              <Text style={{ color: colors.red, fontSize: fonts.sizes.body }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        {editing && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.headerAction}>
              <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.body }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEdit} disabled={saving} style={styles.headerAction}>
              <Text style={{ color: colors.indigo, fontSize: fonts.sizes.body, fontWeight: fonts.weights.semibold }}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        {post.photo_urls.length > 0 && (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
            >
              {post.photo_urls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
            {post.photo_urls.length > 1 && (
              <View style={styles.dots}>
                {post.photo_urls.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
          {/* Author */}
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => router.push(`/user?id=${post.user_id}`)}
            activeOpacity={0.7}
          >
            {post.author_photo ? (
              <Image source={{ uri: post.author_photo }} style={styles.authorAvatar} />
            ) : (
              <View style={[styles.authorAvatar, { backgroundColor: colors.bgSecondary, justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: 16 }}>👤</Text>
              </View>
            )}
            <View>
              <Text style={styles.authorName}>{post.author_name}</Text>
              <Text style={styles.authorUsername}>@{post.author_username}</Text>
            </View>
          </TouchableOpacity>

          {/* Place */}
          <TouchableOpacity onPress={openInMaps} activeOpacity={0.7}>
            <Text style={styles.placeName}>{post.place_name}</Text>
            <Text style={styles.placeAddress}>
              📍 {post.city || post.place_address} · Tap to open in Maps
            </Text>
          </TouchableOpacity>

          {/* Rating */}
          {editing ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.editLabel}>Rating</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => { setEditRating(n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                    <Text style={[styles.starEdit, n <= editRating && styles.starEditActive]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : post.rating > 0 ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{"★".repeat(post.rating)} {post.rating}/5</Text>
            </View>
          ) : null}

          {/* Caption */}
          {editing ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.editLabel}>Caption</Text>
              <TextInput
                style={styles.editInput}
                value={editCaption}
                onChangeText={setEditCaption}
                multiline
                placeholderTextColor={colors.textPlaceholder}
              />
            </View>
          ) : post.caption ? (
            <Text style={styles.caption}>{post.caption}</Text>
          ) : null}

          {/* Tags */}
          {editing ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.editLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.editInput}
                value={editTags}
                onChangeText={setEditTags}
                placeholderTextColor={colors.textPlaceholder}
              />
            </View>
          ) : post.tags.length > 0 ? (
            <View style={styles.tags}>
              {post.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Date */}
          <Text style={styles.date}>
            Visited {new Date(post.visited_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: colors.indigo, fontSize: fonts.sizes.body, fontWeight: fonts.weights.medium },
  headerActions: { flexDirection: "row", gap: 16 },
  headerAction: { paddingVertical: 4 },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    resizeMode: "cover",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.bgTertiary,
  },
  dotActive: {
    backgroundColor: colors.indigo,
    width: 20,
  },
  content: { padding: spacing.md },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  authorAvatar: { width: 44, height: 44, borderRadius: 22 },
  authorName: { color: colors.text, fontSize: fonts.sizes.body, fontWeight: fonts.weights.semibold },
  authorUsername: { color: colors.textMuted, fontSize: fonts.sizes.footnote },
  placeName: {
    color: colors.text,
    fontSize: fonts.sizes.title1,
    fontWeight: fonts.weights.bold,
  },
  placeAddress: {
    color: colors.indigo,
    fontSize: fonts.sizes.subheadline,
    marginTop: 4,
  },
  ratingBadge: {
    marginTop: 16,
    backgroundColor: "rgba(245,158,11,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    alignSelf: "flex-start",
  },
  ratingText: {
    color: colors.amber,
    fontSize: fonts.sizes.subheadline,
    fontWeight: fonts.weights.semibold,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.body,
    lineHeight: 24,
    marginTop: 16,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  tag: {
    backgroundColor: colors.indigoDim,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  tagText: { color: colors.indigo, fontSize: fonts.sizes.footnote, fontWeight: fonts.weights.medium },
  date: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    marginTop: 20,
  },
  editLabel: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text,
    fontSize: fonts.sizes.body,
    minHeight: 44,
  },
  ratingRow: { flexDirection: "row", gap: 12 },
  starEdit: { fontSize: 32, color: colors.bgTertiary },
  starEditActive: { color: colors.amber },
});
