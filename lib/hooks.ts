"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { PostWithAuthor, UserProfile, PlaceCache } from "./types";

// ============================================================
// POSTS
// ============================================================
export function useExplorePosts(page = 0, pageSize = 12) {
  return useQuery({
    queryKey: ["explore", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts_with_author")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return data as PostWithAuthor[];
    },
    staleTime: 60_000,
  });
}

export function useFeed(page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ["feed", page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_feed", {
        page_size: pageSize,
        page_offset: page * pageSize,
      });
      if (error) throw error;
      return data as PostWithAuthor[];
    },
    staleTime: 30_000,
  });
}

export function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, users!inner(display_name, photo_url, username)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        author_name: p.users?.display_name || "",
        author_photo: p.users?.photo_url || "",
        author_username: p.users?.username || "",
        users: undefined,
      })) as PostWithAuthor[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function usePost(id: string | null) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts_with_author")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as PostWithAuthor;
    },
    enabled: !!id,
    staleTime: 120_000,
  });
}

export function usePlacePosts(placeId: string | null) {
  return useQuery({
    queryKey: ["place-posts", placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts_with_author")
        .select("*")
        .eq("place_id", placeId!)
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PostWithAuthor[];
    },
    enabled: !!placeId,
    staleTime: 120_000,
  });
}

// ============================================================
// USERS
// ============================================================
export function useUserByUsername(username: string | null) {
  return useQuery({
    queryKey: ["user", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username!)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!username,
    staleTime: 120_000,
  });
}

// ============================================================
// FOLLOWS
// ============================================================
export function useIsFollowing(targetUid: string | undefined, myUid: string | undefined) {
  return useQuery({
    queryKey: ["following", myUid, targetUid],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", myUid!)
        .eq("following_id", targetUid!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!targetUid && !!myUid && targetUid !== myUid,
    staleTime: 60_000,
  });
}

export function useFollowMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetUid, follow }: { targetUid: string; follow: boolean }) => {
      if (follow) {
        const { error } = await supabase.rpc("follow_user", { target_uid: targetUid });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("unfollow_user", { target_uid: targetUid });
        if (error) throw error;
      }
    },
    onSuccess: (_, { targetUid }) => {
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["followers", targetUid] });
    },
  });
}

export function useFollowers(uid: string | undefined) {
  return useQuery({
    queryKey: ["followers", uid, "followers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id, users!follows_follower_id_fkey(*)")
        .eq("following_id", uid!);
      if (error) throw error;
      return (data || []).map((d: any) => d.users as UserProfile);
    },
    enabled: !!uid,
    staleTime: 60_000,
  });
}

export function useFollowing(uid: string | undefined) {
  return useQuery({
    queryKey: ["followers", uid, "following"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id, users!follows_following_id_fkey(*)")
        .eq("follower_id", uid!);
      if (error) throw error;
      return (data || []).map((d: any) => d.users as UserProfile);
    },
    enabled: !!uid,
    staleTime: 60_000,
  });
}

// ============================================================
// PLACES CACHE
// ============================================================
export function usePlaceCache(placeId: string | null) {
  return useQuery({
    queryKey: ["place-cache", placeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("places_cache")
        .select("*")
        .eq("place_id", placeId!)
        .maybeSingle();
      return data as PlaceCache | null;
    },
    enabled: !!placeId,
    staleTime: 24 * 60 * 60_000, // 24h
  });
}

// ============================================================
// SEARCH
// ============================================================
export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const q = query.toLowerCase().trim().replace(/[%_]/g, "");
      if (!q) return { posts: [] as PostWithAuthor[], users: [] as UserProfile[] };

      // Search posts by text fields
      const textSearch = supabase
        .from("posts")
        .select("*, users(display_name, photo_url, username)")
        .eq("visibility", "public")
        .or(`place_name.ilike.%${q}%,city.ilike.%${q}%,caption.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      // Search posts by tag (array contains)
      const tagSearch = supabase
        .from("posts")
        .select("*, users(display_name, photo_url, username)")
        .eq("visibility", "public")
        .contains("tags", [q])
        .order("created_at", { ascending: false })
        .limit(50);

      const usersSearch = supabase
        .from("users")
        .select("*")
        .eq("onboarded", true)
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%,home_city.ilike.%${q}%`)
        .limit(30);

      const [textRes, tagRes, usersRes] = await Promise.all([textSearch, tagSearch, usersSearch]);

      // Merge and deduplicate posts
      const allPosts = [...(textRes.data || []), ...(tagRes.data || [])];
      const seen = new Set<string>();
      const uniquePosts: any[] = [];
      for (const p of allPosts) {
        if (!seen.has(p.id)) { seen.add(p.id); uniquePosts.push(p); }
      }

      const posts = uniquePosts.map((p: any) => ({
        ...p,
        author_name: p.users?.display_name || "",
        author_photo: p.users?.photo_url || "",
        author_username: p.users?.username || "",
        users: undefined,
      })) as PostWithAuthor[];

      return {
        posts,
        users: (usersRes.data || []) as UserProfile[],
      };
    },
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

// ============================================================
// ALL USERS (for People tab default)
// ============================================================
export function useAllUsers() {
  return useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("onboarded", true)
        .order("post_count", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as UserProfile[];
    },
    staleTime: 120_000,
  });
}

// ============================================================
// ALL TAGS (for Tags tab default)
// ============================================================
export function useAllTags() {
  return useQuery({
    queryKey: ["all-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("tags")
        .eq("visibility", "public")
        .limit(500);
      if (error) throw error;
      const tagCounts = new Map<string, number>();
      (data || []).forEach((p: any) => {
        if (p.tags) p.tags.forEach((t: string) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1));
      });
      return [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
    },
    staleTime: 120_000,
  });
}
