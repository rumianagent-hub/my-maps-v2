import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import type { Post } from "../../lib/types";
import { colors } from "../../lib/theme";
import { useRouter } from "expo-router";

export default function MapScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadPosts();
  }, [user]);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setPosts((data as Post[]) || []);
    setLoading(false);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🗺️</Text>
          <Text style={{ color: colors.textMuted, fontSize: 16 }}>Sign in to see your map</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  const validPosts = posts.filter((p) => p.lat !== 0 && p.lng !== 0);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: validPosts[0]?.lat || 43.65,
          longitude: validPosts[0]?.lng || -79.38,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        userInterfaceStyle="dark"
      >
        {validPosts.map((post) => (
          <Marker
            key={post.id}
            coordinate={{ latitude: post.lat, longitude: post.lng }}
            title={post.place_name}
            description={post.city}
            onCalloutPress={() => router.push(`/post?id=${post.id}`)}
          />
        ))}
      </MapView>
      <SafeAreaView style={styles.overlay}>
        <Text style={styles.overlayText}>🗺️ {validPosts.length} places</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  overlay: { position: "absolute", top: 0, left: 16 },
  overlayText: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: "500",
    overflow: "hidden",
  },
});
