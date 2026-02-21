import { supabase } from "./supabase";
import type { PlaceCache } from "./types";

/**
 * Get place details - first checks Supabase cache, falls back to Google Places API.
 * Saves to cache on miss to avoid repeated API calls.
 */
export async function getPlaceDetails(
  placeId: string,
  mapsLoaded: boolean
): Promise<PlaceCache | null> {
  // 1. Check cache first
  const { data: cached } = await supabase
    .from("places_cache")
    .select("*")
    .eq("place_id", placeId)
    .maybeSingle();

  if (cached) {
    // Refresh if older than 30 days
    const age = Date.now() - new Date(cached.cached_at).getTime();
    if (age < 30 * 24 * 60 * 60 * 1000) {
      return cached as PlaceCache;
    }
  }

  // 2. Fetch from Google Places API
  if (!mapsLoaded || typeof google === "undefined") return cached as PlaceCache | null;

  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(document.createElement("div"));
    service.getDetails(
      {
        placeId,
        fields: [
          "name", "formatted_address", "formatted_phone_number",
          "website", "rating", "user_ratings_total", "price_level",
          "opening_hours", "photos", "types", "geometry", "url",
        ],
      },
      async (result, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
          resolve(cached as PlaceCache | null);
          return;
        }

        const photos = result.photos
          ? result.photos.slice(0, 6).map((p) => p.getUrl({ maxWidth: 800 }))
          : [];

        const place: PlaceCache = {
          place_id: placeId,
          name: result.name || "",
          address: result.formatted_address || "",
          phone: result.formatted_phone_number || "",
          website: result.website || "",
          rating: result.rating || 0,
          user_ratings_total: result.user_ratings_total || 0,
          price_level: result.price_level ?? -1,
          hours: result.opening_hours?.weekday_text || [],
          types: result.types || [],
          lat: result.geometry?.location?.lat() || 0,
          lng: result.geometry?.location?.lng() || 0,
          google_maps_url: result.url || "",
          photos,
          cached_at: new Date().toISOString(),
        };

        // 3. Save to cache (upsert)
        await supabase.from("places_cache").upsert(place, { onConflict: "place_id" });

        resolve(place);
      }
    );
  });
}
