"use client";

import { useState } from "react";
import { useSearch, useExplorePosts, useAllUsers, useAllTags } from "@/lib/hooks";
import PostCard from "@/components/PostCard";
import { FiSearch, FiX, FiUser, FiMapPin, FiHash } from "react-icons/fi";
import Link from "next/link";

type Tab = "all" | "restaurants" | "people" | "tags";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const { data: searchResults } = useSearch(searchQuery);
  const { data: defaultPosts = [] } = useExplorePosts(0);
  const { data: allUsers = [] } = useAllUsers();
  const { data: allTags = [] } = useAllTags();

  const searched = searchQuery.trim().length >= 2;
  const posts = searched ? (searchResults?.posts || []) : defaultPosts.slice(0, 12);
  const users = searched ? (searchResults?.users || []) : allUsers;

  // Tags: from search results or from all posts
  const tagCounts = new Map<string, number>();
  if (searched) {
    posts.forEach((p) => p.tags?.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));
  }
  const sortedTags = searched
    ? [...tagCounts.entries()].sort((a, b) => b[1] - a[1])
    : allTags;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <FiSearch size={14} /> },
    { id: "restaurants", label: "Restaurants", icon: <FiMapPin size={14} /> },
    { id: "people", label: "People", icon: <FiUser size={14} /> },
    { id: "tags", label: "Tags", icon: <FiHash size={14} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-8 animate-fade-in">
      <div className="relative mb-5">
        <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search restaurants, people, tags..." autoFocus
          className="w-full pl-11 pr-10 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-zinc-100 placeholder:text-zinc-600 text-sm" />
        {searchQuery && <button onClick={() => { setSearchQuery(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/[0.06] rounded-lg"><FiX size={16} className="text-zinc-500" /></button>}
      </div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" : "text-zinc-500 bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06]"
            }`}>{t.icon}{t.label}</button>
        ))}
      </div>

      {/* PEOPLE */}
      {(tab === "all" || tab === "people") && users.length > 0 && (
        <div className="mb-8">
          {tab === "all" && <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">People</h2>}
          {tab === "people" && !searched && <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">All Users</h2>}
          <div className="space-y-2">
            {users.slice(0, tab === "people" ? 50 : 5).map((u) => (
              <Link key={u.id} href={`/user?u=${u.username}`} className="flex items-center gap-3 p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.04] hover:bg-white/[0.06] transition-all">
                <img src={u.photo_url || "/default-avatar.png"} alt="" className="w-11 h-11 rounded-xl ring-2 ring-indigo-500/10 object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-zinc-100 truncate">{u.display_name}</div>
                  <div className="text-xs text-zinc-500">@{u.username}</div>
                  {u.bio && <div className="text-xs text-zinc-600 truncate mt-0.5">{u.bio}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-zinc-500">{u.post_count || 0} posts</div>
                  <div className="text-xs text-zinc-600">{u.follower_count || 0} followers</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TAGS */}
      {(tab === "all" || tab === "tags") && sortedTags.length > 0 && (
        <div className="mb-8">
          {tab === "all" && <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Popular Tags</h2>}
          {tab === "tags" && !searched && <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">All Tags</h2>}
          <div className="flex flex-wrap gap-2">
            {sortedTags.slice(0, tab === "tags" ? 100 : 10).map(([tag, count]) => (
              <button key={tag} onClick={() => setSearchQuery(tag)} className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-medium border border-indigo-500/10 hover:border-indigo-500/20 transition-all">
                <FiHash size={13} />{tag}<span className="text-indigo-400/50 text-xs">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESTAURANTS */}
      {(tab === "all" || tab === "restaurants") && posts.length > 0 && (
        <div>
          {tab === "all" && <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Restaurants</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
            {posts.slice(0, tab === "restaurants" ? 50 : 6).map((post) => <PostCard key={post.id} post={post} showAuthor />)}
          </div>
        </div>
      )}

      {searched && posts.length === 0 && users.length === 0 && (
        <div className="text-center py-20 text-zinc-500"><div className="text-5xl mb-4">🔍</div><p className="text-lg">No results for &ldquo;{searchQuery}&rdquo;</p><p className="text-sm mt-2">Try a different search term</p></div>
      )}
    </div>
  );
}
