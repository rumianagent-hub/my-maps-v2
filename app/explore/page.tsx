"use client";

import { useState } from "react";
import { useExplorePosts } from "@/lib/hooks";
import PostCard from "@/components/PostCard";
import { FiCompass } from "react-icons/fi";

export default function ExplorePage() {
  const [page, setPage] = useState(0);
  const { data: posts = [], isLoading } = useExplorePosts(page);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center"><FiCompass size={20} className="text-indigo-400" /></div>
        <div><h1 className="text-2xl font-bold text-zinc-100">Explore</h1><p className="text-zinc-500 text-sm">Discover restaurants from the community</p></div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-72 shimmer rounded-2xl" />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 text-zinc-500"><div className="text-5xl mb-4">🍽️</div><p className="text-lg">No posts yet. Be the first to share!</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">{posts.map((post) => <PostCard key={post.id} post={post} showAuthor />)}</div>
          {posts.length === 12 && (
            <div className="text-center mt-10">
              <button onClick={() => setPage((p) => p + 1)} className="px-8 py-3 bg-white/[0.04] text-zinc-400 rounded-xl text-sm font-medium hover:bg-white/[0.08] border border-white/[0.06] transition-all">Load More</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
