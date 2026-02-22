"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { usePlacePosts, usePlaceCache } from "@/lib/hooks";
import { getPlaceDetails } from "@/lib/places";
import type { PlaceCache } from "@/lib/types";
import GoogleMapsLoader, { useMapsLoaded } from "@/components/GoogleMapsLoader";
import PostCard from "@/components/PostCard";
import { SkeletonPostGrid } from "@/components/Skeleton";
import { FiMapPin, FiStar, FiPhone, FiClock, FiExternalLink, FiArrowLeft, FiNavigation, FiDollarSign, FiGlobe } from "react-icons/fi";
import { useSearchParams, useRouter } from "next/navigation";

function PlaceSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
      <div className="shimmer h-8 w-20 rounded-xl mb-6" />
      <div className="shimmer h-52 rounded-2xl mb-6" />
      <div className="shimmer h-10 w-3/4 rounded-lg mb-3" />
      <div className="shimmer h-4 w-1/2 rounded-lg mb-6" />
      <SkeletonPostGrid count={3} />
    </div>
  );
}

function PlaceInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const placeId = searchParams.get("id");
  const mapsLoaded = useMapsLoaded();
  const { data: posts = [], isLoading: postsLoading } = usePlacePosts(placeId);
  const { data: cached } = usePlaceCache(placeId);
  const [place, setPlace] = useState<PlaceCache | null>(null);
  const [placeLoading, setPlaceLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placeId) { setPlaceLoading(false); return; }
    if (cached) { setPlace(cached); setPlaceLoading(false); return; }
    if (!mapsLoaded) return;
    getPlaceDetails(placeId, mapsLoaded).then((p) => { setPlace(p); setPlaceLoading(false); });
  }, [placeId, mapsLoaded, cached]);

  useEffect(() => {
    if (!place || !mapsLoaded || !mapRef.current || !place.lat) return;
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: place.lat, lng: place.lng }, zoom: 15, disableDefaultUI: true, zoomControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8888aa" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
    new google.maps.Marker({ position: { lat: place.lat, lng: place.lng }, map, title: place.name });
  }, [place, mapsLoaded]);

  const handleBack = () => { window.history.length > 1 ? router.back() : router.push("/explore"); };
  const displayName = place?.name || posts[0]?.place_name || "Unknown Place";
  const displayAddress = place?.address || posts[0]?.place_address || "";
  const ourRatings = posts.filter((p) => p.rating > 0);
  const communityAvg = ourRatings.length > 0 ? ourRatings.reduce((sum, p) => sum + p.rating, 0) / ourRatings.length : 0;

  if (placeLoading && postsLoading) return <PlaceSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 animate-fade-in">
      <button onClick={handleBack} className="flex items-center gap-2 p-2 hover:bg-white/[0.06] rounded-xl text-zinc-400 hover:text-zinc-200 mb-6"><FiArrowLeft size={20} /><span className="text-sm font-medium">Back</span></button>

      {place && place.photos.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4">
          {place.photos.map((url, i) => (
            <div key={i} className="h-52 flex-shrink-0 rounded-2xl overflow-hidden border border-white/[0.06]">
              <img src={url} alt={displayName} className="h-full w-auto object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">{displayName}</h1>
            <div className="flex items-center gap-1.5 text-zinc-500 mt-2"><FiMapPin size={16} className="text-indigo-400/60 flex-shrink-0" /><span>{displayAddress}</span></div>
          </div>
          {place?.google_maps_url && (
            <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-sm font-medium border border-indigo-500/20 hover:bg-indigo-500/20 flex-shrink-0">
              <FiNavigation size={14} />Directions
            </a>
          )}
        </div>
        {place && place.types.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {place.types.filter((t) => !["point_of_interest", "establishment", "food", "store"].includes(t)).slice(0, 5).map((t) => (
              <span key={t} className="px-3 py-1 bg-white/[0.04] text-zinc-400 rounded-full text-xs font-medium border border-white/[0.04]">{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-5">
          {place && place.rating > 0 && <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full text-sm font-medium"><FiStar size={14} className="fill-amber-400" />{place.rating.toFixed(1)}<span className="text-amber-400/50 ml-0.5">({place.user_ratings_total.toLocaleString()})</span></div>}
          {place && place.price_level >= 0 && <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-medium"><FiDollarSign size={14} />{"$".repeat(place.price_level || 1)}</div>}
          {communityAvg > 0 && <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full text-sm font-medium"><FiStar size={14} />{communityAvg.toFixed(1)} community<span className="text-indigo-400/50 ml-0.5">({ourRatings.length})</span></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {(place?.phone || place?.website) && (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-white/[0.06] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Contact</h3>
            {place.phone && <a href={`tel:${place.phone}`} className="flex items-center gap-3 text-zinc-300 hover:text-indigo-400"><FiPhone size={16} className="text-zinc-500" /><span className="text-sm">{place.phone}</span></a>}
            {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-zinc-300 hover:text-indigo-400"><FiGlobe size={16} className="text-zinc-500" /><span className="text-sm truncate">{new URL(place.website).hostname}</span><FiExternalLink size={12} className="text-zinc-600 flex-shrink-0" /></a>}
          </div>
        )}
        {place && place.hours.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-white/[0.06] p-5">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2"><FiClock size={14} />Hours</h3>
            <div className="space-y-1.5">{place.hours.map((line, i) => {
              const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
              const isToday = line.toLowerCase().startsWith(today.toLowerCase());
              return <div key={i} className={`text-xs ${isToday ? "text-indigo-400 font-semibold" : "text-zinc-500"}`}>{line}</div>;
            })}</div>
          </div>
        )}
      </div>

      {place && place.lat !== 0 && <div ref={mapRef} className="w-full h-48 rounded-2xl border border-white/[0.06] mb-8" />}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-100">Community Posts{posts.length > 0 && <span className="text-zinc-500 font-normal ml-2 text-base">({posts.length})</span>}</h2>
        <p className="text-zinc-500 text-sm mt-1">What people are saying about {displayName}</p>
      </div>

      {postsLoading && posts.length === 0 ? (
        <SkeletonPostGrid count={3} />
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 bg-[var(--bg-card)] rounded-2xl border border-white/[0.06]"><div className="text-4xl mb-3">📝</div><p>No one has posted about {displayName} yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">{posts.map((post) => <PostCard key={post.id} post={post} showAuthor />)}</div>
      )}
    </div>
  );
}

function PlaceContent() {
  return <GoogleMapsLoader><PlaceInner /></GoogleMapsLoader>;
}

export default function PlacePage() {
  return <Suspense fallback={<PlaceSkeleton />}><PlaceContent /></Suspense>;
}
