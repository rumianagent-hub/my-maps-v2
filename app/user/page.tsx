"use client";

import { Suspense } from "react";
import { useUserByUsername } from "@/lib/hooks";
import ProfileTabs from "@/components/ProfileTabs";
import FollowButton from "@/components/FollowButton";
import { FiMapPin } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UserContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get("u");
  const { data: profile, isLoading } = useUserByUsername(username);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="flex flex-col items-center justify-center min-h-screen text-zinc-500"><p>User not found</p><Link href="/" className="text-indigo-400 mt-2">Go home</Link></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-8 animate-fade-in">
      <div className="flex items-start gap-5 mb-8">
        <img src={profile.photo_url || "/default-avatar.png"} alt={profile.display_name} className="w-20 h-20 rounded-2xl ring-2 ring-indigo-500/20 object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-100">{profile.display_name}</h1>
          <p className="text-sm text-zinc-500">@{profile.username}</p>
          {profile.bio && <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{profile.bio}</p>}
          {profile.home_city && <p className="flex items-center gap-1.5 text-sm text-zinc-500 mt-1.5"><FiMapPin size={13} className="text-indigo-400/60" />{profile.home_city}</p>}
          <div className="flex gap-5 mt-3 text-sm text-zinc-500">
            <span><strong className="text-zinc-200 font-semibold">{profile.post_count || 0}</strong> posts</span>
            <Link href={`/followers?uid=${profile.id}&tab=followers`} className="hover:text-zinc-300"><strong className="text-zinc-200 font-semibold">{profile.follower_count || 0}</strong> followers</Link>
            <Link href={`/followers?uid=${profile.id}&tab=following`} className="hover:text-zinc-300"><strong className="text-zinc-200 font-semibold">{profile.following_count || 0}</strong> following</Link>
          </div>
        </div>
        <FollowButton targetUid={profile.id} />
      </div>
      <ProfileTabs uid={profile.id} />
    </div>
  );
}

export default function UserPage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}><UserContent /></Suspense>;
}
