import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, Alert, ActivityIndicator, Dimensions, FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { colors, fonts, spacing, radii } from "../../lib/theme";
import { useRouter } from "expo-router";
import { decode } from "base64-arraybuffer";
import type { PlaceCache } from "../../lib/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STEPS = ["Photos", "Restaurant", "Details"];
const SUGGESTED_TAGS = [
  "date night", "casual", "fine dining", "brunch", "lunch",
  "dinner", "takeout", "delivery", "outdoor", "rooftop",
  "sushi", "pizza", "thai", "indian", "mexican", "italian",
  "chinese", "korean", "japanese", "mediterranean",
  "spicy", "healthy", "comfort food", "vegan", "halal",
];

export default function AddScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [placeAddress, setPlaceAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [placeId, setPlaceId] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const scrollRef = useRef<ScrollView>(null);

  // Place search
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceCache[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  if (!user || !profile?.onboarded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📝</Text>
          <Text style={styles.emptyTitle}>Sign in to add posts</Text>
          <Text style={styles.emptySubtitle}>Log your restaurant visits and share with friends</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((p) => p.filter((_, i) => i !== index));
  };

  const searchPlaces = async (q: string) => {
    setPlaceQuery(q);
    if (q.trim().length < 2) {
      setPlaceResults([]);
      return;
    }
    setSearchingPlaces(true);
    const { data } = await supabase
      .from("places_cache")
      .select("*")
      .ilike("name", `%${q.trim()}%`)
      .limit(10);
    setPlaceResults((data as PlaceCache[]) || []);
    setSearchingPlaces(false);
  };

  const selectPlace = (place: PlaceCache) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlaceName(place.name);
    setPlaceAddress(place.address);
    setCity(""); // Derive from address if needed
    setLat(place.lat);
    setLng(place.lng);
    setPlaceId(place.place_id);
    setPlaceQuery(place.name);
    setPlaceResults([]);
  };

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 8)
    );
  };

  const setRatingWithHaptic = (n: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRating(n);
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
      .from("posts")
      .upload(fileName, decode(base64), { contentType: "image/jpeg" });
    if (error) throw error;

    const { data } = supabase.storage.from("posts").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const submit = async () => {
    if (!placeName.trim()) {
      Alert.alert("Missing info", "Please select or enter a restaurant name");
      return;
    }
    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setUploadProgress((i / photos.length) * 100);
        const url = await uploadPhoto(photos[i], i);
        photoUrls.push(url);
      }
      setUploadProgress(100);

      const { error } = await supabase.from("posts").insert({
        user_id: user!.id,
        place_id: placeId || `manual_${Date.now()}`,
        place_name: placeName.trim(),
        place_address: placeAddress.trim(),
        city: city.trim(),
        lat,
        lng,
        caption: caption.trim(),
        rating,
        tags,
        visited_at: new Date().toISOString(),
        photo_urls: photoUrls,
        visibility: "public",
      });
      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Posted! 🎉", "Your visit has been logged.");

      // Reset
      setStep(0);
      setPhotos([]);
      setPlaceName("");
      setPlaceAddress("");
      setCity("");
      setCaption("");
      setRating(0);
      setTags([]);
      setPlaceQuery("");
      setUploadProgress(0);
      router.push("/(tabs)");
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e.message || "Failed to post");
    }
    setSubmitting(false);
  };

  const canAdvance = () => {
    if (step === 0) return true; // photos optional
    if (step === 1) return placeName.trim().length > 0;
    return true;
  };

  const nextStep = () => {
    if (step < STEPS.length - 1 && canAdvance()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log a Visit</Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, i <= step && styles.stepDotTextActive]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Upload progress */}
        {submitting && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Step 0: Photos */}
          {step === 0 && (
            <View>
              <Text style={styles.stepTitle}>Add Photos</Text>
              <Text style={styles.stepSubtitle}>Share photos of your meal (optional, up to 5)</Text>

              <TouchableOpacity style={styles.photoPickerBtn} onPress={pickPhotos} activeOpacity={0.7}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📷</Text>
                <Text style={styles.photoPickerText}>Tap to select photos</Text>
                <Text style={styles.photoPickerCount}>{photos.length}/5</Text>
              </TouchableOpacity>

              {photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {photos.map((uri, i) => (
                    <View key={i} style={styles.photoItem}>
                      <Image source={{ uri }} style={styles.photoPreview} />
                      <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(i)}>
                        <Text style={styles.photoRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Step 1: Restaurant */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Select Restaurant</Text>
              <Text style={styles.stepSubtitle}>Search our database or enter manually</Text>

              <View style={styles.searchBar}>
                <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search restaurants..."
                  placeholderTextColor={colors.textPlaceholder}
                  value={placeQuery}
                  onChangeText={searchPlaces}
                  autoCapitalize="none"
                />
              </View>

              {searchingPlaces && (
                <ActivityIndicator size="small" color={colors.indigo} style={{ marginTop: 12 }} />
              )}

              {placeResults.length > 0 && (
                <View style={styles.placeResults}>
                  {placeResults.map((place) => (
                    <TouchableOpacity
                      key={place.place_id}
                      style={styles.placeResult}
                      onPress={() => selectPlace(place)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.placeResultName}>{place.name}</Text>
                      <Text style={styles.placeResultAddr} numberOfLines={1}>{place.address}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.orDivider}>— or enter manually —</Text>

              <Text style={styles.label}>Restaurant Name *</Text>
              <TextInput
                style={styles.input}
                value={placeName}
                onChangeText={setPlaceName}
                placeholder="e.g. Pai Northern Thai"
                placeholderTextColor={colors.textPlaceholder}
              />

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={placeAddress}
                onChangeText={setPlaceAddress}
                placeholder="123 Main St"
                placeholderTextColor={colors.textPlaceholder}
              />

              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Toronto"
                placeholderTextColor={colors.textPlaceholder}
              />
            </View>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>Add Details</Text>
              <Text style={styles.stepSubtitle}>Rate and describe your experience</Text>

              <Text style={styles.label}>Rating</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setRatingWithHaptic(n)} activeOpacity={0.7}>
                    <Text style={[styles.star, n <= rating && styles.starActive]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagGrid}>
                {SUGGESTED_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, tags.includes(tag) && styles.tagChipActive]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagChipText, tags.includes(tag) && styles.tagChipTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Caption</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                value={caption}
                onChangeText={setCaption}
                placeholder="What did you think?"
                placeholderTextColor={colors.textPlaceholder}
                multiline
                onFocus={() => {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
                }}
              />
            </View>
          )}
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.bottomBar}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={prevStep} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, step === 0 && { flex: 1 }, !canAdvance() && styles.nextBtnDisabled]}
            onPress={step === STEPS.length - 1 ? submit : nextStep}
            disabled={submitting || !canAdvance()}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.nextBtnText}>
                {step === STEPS.length - 1 ? "Post Visit 🍽️" : "Next"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { color: colors.text, fontSize: fonts.sizes.title3, fontWeight: fonts.weights.semibold, marginBottom: 8 },
  emptySubtitle: { color: colors.textMuted, fontSize: fonts.sizes.subheadline, textAlign: "center" },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  headerTitle: { fontSize: fonts.sizes.largeTitle, fontWeight: fonts.weights.bold, color: colors.text },
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
  },
  stepItem: { alignItems: "center", gap: 6 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: { backgroundColor: colors.indigo },
  stepDotText: { color: colors.textMuted, fontSize: fonts.sizes.caption1, fontWeight: fonts.weights.semibold },
  stepDotTextActive: { color: colors.white },
  stepLabel: { color: colors.textMuted, fontSize: fonts.sizes.caption2, fontWeight: fonts.weights.medium },
  stepLabelActive: { color: colors.text },
  progressBar: {
    height: 3,
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.md,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.indigo,
    borderRadius: 2,
  },
  scroll: { padding: spacing.md, paddingBottom: 120 },
  stepTitle: { fontSize: fonts.sizes.title2, fontWeight: fonts.weights.bold, color: colors.text, marginBottom: 4 },
  stepSubtitle: { color: colors.textMuted, fontSize: fonts.sizes.subheadline, marginBottom: 20 },
  photoPickerBtn: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radii.lg,
    padding: 32,
    alignItems: "center",
  },
  photoPickerText: { color: colors.textSecondary, fontSize: fonts.sizes.subheadline },
  photoPickerCount: { color: colors.textMuted, fontSize: fonts.sizes.caption1, marginTop: 4 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  photoItem: { position: "relative" },
  photoPreview: { width: (SCREEN_WIDTH - 48 - 16) / 3, height: (SCREEN_WIDTH - 48 - 16) / 3, borderRadius: radii.md },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  photoRemoveText: { color: colors.white, fontSize: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(118,118,128,0.24)",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: fonts.sizes.body, paddingVertical: 10 },
  placeResults: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    overflow: "hidden",
    marginBottom: 16,
  },
  placeResult: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  placeResultName: { color: colors.text, fontSize: fonts.sizes.body, fontWeight: fonts.weights.medium },
  placeResultAddr: { color: colors.textMuted, fontSize: fonts.sizes.footnote, marginTop: 2 },
  orDivider: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    textAlign: "center",
    marginVertical: 16,
  },
  label: {
    color: colors.textMuted,
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.medium,
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text,
    fontSize: fonts.sizes.body,
  },
  ratingRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  star: { fontSize: 36, color: colors.bgTertiary },
  starActive: { color: colors.amber },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.bgSecondary,
  },
  tagChipActive: { backgroundColor: colors.indigoDim },
  tagChipText: { color: colors.textMuted, fontSize: fonts.sizes.footnote, fontWeight: fonts.weights.medium },
  tagChipTextActive: { color: colors.indigo },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    paddingBottom: 90,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgSecondary,
  },
  backBtnText: { color: colors.text, fontSize: fonts.sizes.body, fontWeight: fonts.weights.medium },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.indigo,
    alignItems: "center",
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: colors.white, fontSize: fonts.sizes.body, fontWeight: fonts.weights.semibold },
});
