"use client";

import { useAuth } from "@/lib/auth-context";
import { useIsFollowing, useFollowMutation } from "@/lib/hooks";

export default function FollowButton({ targetUid }: { targetUid: string }) {
  const { user } = useAuth();
  const { data: isFollowing, isLoading } = useIsFollowing(targetUid, user?.id);
  const mutation = useFollowMutation();

  if (!user || user.id === targetUid) return null;

  const toggle = () => mutation.mutate({ targetUid, follow: !isFollowing });
  const loading = isLoading || mutation.isPending;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
        isFollowing
          ? "bg-white/[0.06] text-zinc-300 hover:bg-rose-500/15 hover:text-rose-400 border border-white/[0.06]"
          : "btn-primary"
      }`}
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
