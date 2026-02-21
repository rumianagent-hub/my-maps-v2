"use client";

import { useState, lazy, Suspense } from "react";
import { useUserPosts } from "@/lib/hooks";
import type { PostWithAuthor } from "@/lib/types";
import { FiMap, FiGrid, FiList, FiMapPin } from "react-icons/fi";
import PostCard from "./PostCard";
import GoogleMapsLoader from "./GoogleMapsLoader";
import MapView from "./MapView";

export default function ProfileTabs({ uid }: { uid: string }) {
  const [tab, setTab] = useState<"posts" | "map" | "list">("posts");
  const { data: posts = [], isLoading } = useUserPosts(uid);
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? posts.filter((p) => p.place_name.toLowerCase().includes(filter.toLowerCase()) || p.city?.toLowerCase().includes(filter.toLowerCase()) || p.tags.some((t) => t.includes(filter.toLowerCase())))
    : posts;

  const tabs = [
    { id: "posts" as const, icon: FiGrid, label: "Posts" },
    { id: "map" as const, icon: FiMap, label: "Map" },
    { id: "list" as const, icon: FiList, label: "List" },
  ];

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-48 shimmer rounded-2xl" />)}</div>;

  return (
    <div>
      <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 mb-5 border border-white/[0.04]">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-indigo-500/15 text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-5 mb-5 text-sm text-zinc-500">
        <span className="flex items-center gap-1.5">
          <FiMapPin size={14} className="text-indigo-400" />
          <strong className="text-zinc-300">{posts.length}</strong> places
        </span>
        <span><strong className="text-zinc-300">{new Set(posts.map((p) => p.city).filter(Boolean)).size}</strong> cities</span>
      </div>

      {tab !== "map" && (
        <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name, city, or tag..."
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-5 text-sm text-zinc-100 placeholder:text-zinc-600" />
      )}

      {tab === "map" && (
        <div className="h-[60vh] rounded-2xl overflow-hidden border border-white/[0.06]">
          <GoogleMapsLoader>
            <MapView posts={filtered} />
          </GoogleMapsLoader>
        </div>
      )}

      {tab === "list" && (
        <div className="space-y-2">
          {filtered.length === 0 ? <div className="text-center py-16 text-zinc-600">No visits yet</div> :
            filtered.map((post) => (
              <div key={post.id} className="flex items-center gap-4 p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.04] hover:bg-white/[0.06] transition-all cursor-pointer"
                onClick={() => window.location.href = `/post?id=${post.id}`}>
                {post.photo_urls[0] && <img src={post.photo_urls[0]} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" loading="lazy" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-100 text-sm truncate">{post.place_name}</div>
                  <div className="text-xs text-zinc-500">{post.city}</div>
                </div>
                {post.rating > 0 && <div className="text-sm text-amber-400 font-semibold">{post.rating}★</div>}
              </div>
            ))}
        </div>
      )}

      {tab === "posts" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
          {filtered.length === 0 ? <div className="col-span-2 text-center py-16 text-zinc-600">No visits yet — go explore!</div> :
            filtered.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
