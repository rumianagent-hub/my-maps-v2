"use client";

import { useAuth } from "@/lib/auth-context";
import { useFeed } from "@/lib/hooks";
import PostCard from "@/components/PostCard";
import { SkeletonPostList } from "@/components/Skeleton";
import { FiUsers } from "react-icons/fi";
import Link from "next/link";

export default function FeedPage() {
  const { user, ready } = useAuth();
  const { data: posts = [], isLoading, isError, refetch } = useFeed();
  const showSkeleton = isLoading && posts.length === 0;

  if (!ready || showSkeleton) return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><FiUsers size={20} className="text-rose-400" /></div>
        <div><h1 className="text-2xl font-bold text-zinc-100">Feed</h1><p className="text-zinc-500 text-sm">Posts from people you follow</p></div>
      </div>
      <SkeletonPostList count={3} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><FiUsers size={20} className="text-rose-400" /></div>
        <div><h1 className="text-2xl font-bold text-zinc-100">Feed</h1><p className="text-zinc-500 text-sm">Posts from people you follow</p></div>
      </div>
      {isError ? (
        <div className="text-center py-24 text-zinc-500">
          <div className="text-5xl mb-4">⚠️</div><p className="text-lg mb-4">Failed to load feed</p>
          <button onClick={() => refetch()} className="text-indigo-400 hover:text-indigo-300 font-medium">Try again →</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 text-zinc-500">
          <div className="text-5xl mb-4">👀</div><p className="text-lg mb-4">No posts from people you follow yet.</p>
          <Link href="/explore" className="text-indigo-400 hover:text-indigo-300 font-medium">Explore & find people to follow →</Link>
        </div>
      ) : (
        <div className="space-y-4 stagger">{posts.map((post) => <PostCard key={post.id} post={post} showAuthor />)}</div>
      )}
    </div>
  );
}
