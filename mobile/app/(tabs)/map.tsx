import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  Image, Dimensions, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import type { PostWithAuthor } from "../../lib/types";
import { colors, fonts, radii, spacing } from "../../lib/theme";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
type MapFilter = "all" | "mine" | "following";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

export default function MapScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);

  useEffect(() => {
    loadPosts();
  }, [user, filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      if (filter === "mine" && user) {
        const { data } = await supabase
          .from("posts_with_author")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setPosts((data as PostWithAuthor[]) || []);
      } else if (filter === "following" && user) {
        const { data } = await supabase.rpc("get_feed", { page_size: 100, page_offset: 0 });
        setPosts((data as PostWithAuthor[]) || []);
      } else {
        const { data } = await supabase
          .from("posts_with_author")
          .select("*")
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(100);
        setPosts((data as PostWithAuthor[]) || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const locateMe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const validPosts = posts.filter((p) => p.lat !== 0 && p.lng !== 0);

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: validPosts[0]?.lat || 43.65,
          longitude: validPosts[0]?.lng || -79.38,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        userInterfaceStyle="dark"
        customMapStyle={Platform.OS === "android" ? DARK_MAP_STYLE : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedPost(null)}
      >
        {validPosts.map((post) => (
          <Marker
            key={post.id}
            coordinate={{ latitude: post.lat, longitude: post.lng }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedPost(post);
            }}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerEmoji}>📍</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top controls */}
      <SafeAreaView style={styles.topControls} edges={["top"]}>
        <View style={styles.filterRow}>
          {(["all", "mine", "following"] as MapFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === "all" ? "All" : f === "mine" ? "Mine" : "Following"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{validPosts.length} places</Text>
        </View>
      </SafeAreaView>

      {/* Locate me button */}
      <TouchableOpacity style={styles.locateBtn} onPress={locateMe} activeOpacity={0.7}>
        <Text style={{ fontSize: 20 }}>📍</Text>
      </TouchableOpacity>

      {/* Selected post card */}
      {selectedPost && (
        <TouchableOpacity
          style={styles.selectedCard}
          activeOpacity={0.8}
          onPress={() => router.push(`/post?id=${selectedPost.id}`)}
        >
          {selectedPost.photo_urls.length > 0 && (
            <Image source={{ uri: selectedPost.photo_urls[0] }} style={styles.selectedPhoto} />
          )}
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName} numberOfLines={1}>{selectedPost.place_name}</Text>
            <Text style={styles.selectedCity} numberOfLines={1}>
              {selectedPost.city || selectedPost.place_address}
            </Text>
            {selectedPost.rating > 0 && (
              <Text style={styles.selectedRating}>{"★".repeat(selectedPost.rating)}</Text>
            )}
            <Text style={styles.selectedAuthor}>by @{selectedPost.author_username}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  filterBtnActive: {
    backgroundColor: colors.indigo,
  },
  filterText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.medium,
  },
  filterTextActive: {
    color: colors.white,
  },
  countBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginTop: 8,
  },
  countText: {
    color: colors.white,
    fontSize: fonts.sizes.caption1,
    fontWeight: fonts.weights.medium,
  },
  locateBtn: {
    position: "absolute",
    bottom: 120,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContainer: {
    alignItems: "center",
  },
  markerEmoji: { fontSize: 24 },
  selectedCard: {
    position: "absolute",
    bottom: 100,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedPhoto: {
    width: 100,
    height: 100,
  },
  selectedInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  selectedName: {
    color: colors.text,
    fontSize: fonts.sizes.headline,
    fontWeight: fonts.weights.semibold,
  },
  selectedCity: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    marginTop: 2,
  },
  selectedRating: {
    color: colors.amber,
    fontSize: fonts.sizes.caption1,
    letterSpacing: 1,
    marginTop: 4,
  },
  selectedAuthor: {
    color: colors.textMuted,
    fontSize: fonts.sizes.caption1,
    marginTop: 4,
  },
});
