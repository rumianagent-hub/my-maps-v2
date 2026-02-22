"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { UserProfile } from "./types";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  ready: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithIdToken: (params: { provider: "google"; token: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const mountedRef = useRef(true);
  const profileRetries = useRef(0);

  const loadProfile = useCallback(async (u: User): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", u.id)
        .maybeSingle();
      if (error) {
        console.error("Failed to load profile:", error);
        return null;
      }
      return data as UserProfile | null;
    } catch (e) {
      console.error("Profile load exception:", e);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await loadProfile(user);
    if (p && mountedRef.current) setProfile(p);
  }, [user, loadProfile]);

  // Core auth initialization — get session once, then listen for changes
  useEffect(() => {
    mountedRef.current = true;
    let sub: { unsubscribe: () => void } | null = null;

    const init = async () => {
      // 1. Get current session directly (more reliable than waiting for event)
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;

      if (!mountedRef.current) return;
      setUser(u);

      if (u) {
        const p = await loadProfile(u);
        if (mountedRef.current) {
          setProfile(p);
          // If profile is null, retry up to 2 times
          if (!p && profileRetries.current < 2) {
            profileRetries.current++;
            setTimeout(async () => {
              if (!mountedRef.current) return;
              const retry = await loadProfile(u);
              if (retry && mountedRef.current) setProfile(retry);
            }, 1500);
          }
        }
      }

      if (mountedRef.current) {
        setReady(true);
        setLoading(false);
      }

      // 2. Listen for auth changes AFTER initial state is set
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mountedRef.current) return;
          const newUser = session?.user ?? null;

          if (event === "SIGNED_IN") {
            setUser(newUser);
            if (newUser) {
              setLoading(true);
              const p = await loadProfile(newUser);
              if (mountedRef.current) {
                setProfile(p);
                setLoading(false);
              }
            }
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            setProfile(null);
          } else if (event === "TOKEN_REFRESHED") {
            setUser(newUser);
          }
          // Ignore INITIAL_SESSION since we already handled it above
        }
      );
      sub = subscription;
    };

    init();

    return () => {
      mountedRef.current = false;
      sub?.unsubscribe();
    };
  }, [loadProfile]);

  // Redirect to setup if not onboarded
  useEffect(() => {
    if (!ready) return;
    if (user && profile && !profile.onboarded && pathname !== "/setup") {
      router.push("/setup");
    }
  }, [user, profile, ready, pathname, router]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) console.error("Sign-in failed:", error);
  };

  const signInWithIdToken = async ({ provider, token }: { provider: "google"; token: string }) => {
    const { error } = await supabase.auth.signInWithIdToken({ provider, token });
    if (error) console.error("ID token sign-in failed:", error);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...data, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("users").update(updated).eq("id", user.id);
    if (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
    setProfile((prev) => (prev ? ({ ...prev, ...updated } as UserProfile) : null));
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("username", username.toLowerCase())
      .maybeSingle();
    if (!data) return true;
    return data.id === user?.id;
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, ready, signInWithGoogle, signInWithIdToken,
      logout, updateProfile, checkUsernameAvailable, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
