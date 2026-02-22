import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { useRouter } from "expo-router";
import { decode } from "base64-arraybuffer";

export default function AddScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [placeName, setPlaceName] = useState("");
  const [placeAddress, setPlaceAddress] = useState("");
  const [city, setCity] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!user || !profile?.onboarded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyText}>Sign in to add posts</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const uploadPhoto = async (uri: string, index: number): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.readAsDataURL(blob);
    });

    const fileName = `${user!.id}/${Date.now()}_${index}.jpg`;
    const { error } = await supabase.storage
      .from("post-photos")
      .upload(fileName, decode(base64), { contentType: "image/jpeg" });
    if (error) throw error;

    const { data } = supabase.storage.from("post-photos").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const submit = async () => {
    if (!placeName.trim()) { Alert.alert("Missing info", "Please enter a restaurant name"); return; }
    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const url = await uploadPhoto(photos[i], i);
        photoUrls.push(url);
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user!.id,
        place_id: `manual_${Date.now()}`,
        place_name: placeName.trim(),
        place_address: placeAddress.trim(),
        city: city.trim(),
        lat: 0,
        lng: 0,
        caption: caption.trim(),
        rating,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        visited_at: new Date().toISOString(),
        photo_urls: photoUrls,
        visibility: "public",
      });
      if (error) throw error;

      Alert.alert("Posted! 🎉", "Your visit has been logged.");
      setPlaceName("");
      setPlaceAddress("");
      setCity("");
      setCaption("");
      setRating(0);
      setTags("");
      setPhotos([]);
      router.push("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to post");
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Log a Visit</Text>

        <Text style={styles.label}>Restaurant Name *</Text>
        <TextInput style={styles.input} value={placeName} onChangeText={setPlaceName}
          placeholder="e.g. Pai Northern Thai" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} value={placeAddress} onChangeText={setPlaceAddress}
          placeholder="123 Main St" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity}
          placeholder="Toronto" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Rating</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)}>
              <Text style={[styles.star, n <= rating && styles.starActive]}>⭐</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Caption</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={caption} onChangeText={setCaption}
          placeholder="What did you think?" placeholderTextColor={colors.textMuted}
          multiline textAlignVertical="top" />

        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput style={styles.input} value={tags} onChangeText={setTags}
          placeholder="thai, spicy, date night" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Photos</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhotos}>
          <Text style={styles.photoBtnText}>📷 Pick Photos ({photos.length}/5)</Text>
        </TouchableOpacity>
        {photos.length > 0 && (
          <ScrollView horizontal style={styles.photoRow} showsHorizontalScrollIndicator={false}>
            {photos.map((uri, i) => (
              <TouchableOpacity key={i} onLongPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}>
                <Image source={{ uri }} style={styles.photoPreview} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={submitting} activeOpacity={0.8}>
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>Post Visit 🍽️</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  scroll: { padding: 16, paddingBottom: 40 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 20 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 15,
  },
  ratingRow: { flexDirection: "row", gap: 8 },
  star: { fontSize: 28, opacity: 0.3 },
  starActive: { opacity: 1 },
  photoBtn: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  photoBtnText: { color: colors.textSecondary, fontSize: 14 },
  photoRow: { marginTop: 12 },
  photoPreview: { width: 80, height: 80, borderRadius: 10, marginRight: 8 },
  submitBtn: {
    backgroundColor: colors.indigo,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "600" },
});
