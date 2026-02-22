"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { UserProfile } from "./types";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  ready: boolean; // true once initial session check is done — use this to decide what to render
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
  const [ready, setReady] = useState(false); // initial session resolved
  const [loading, setLoading] = useState(true); // profile still loading
  const initialEventFired = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const loadProfile = useCallback(async (u: User): Promise<UserProfile | null> => {
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
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await loadProfile(user);
    if (p) setProfile(p);
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const u = session?.user ?? null;

        if (event === "INITIAL_SESSION") {
          // First event — resolve initial auth state
          initialEventFired.current = true;
          setUser(u);
          if (u) {
            const p = await loadProfile(u);
            if (mounted) setProfile(p);
          } else {
            setProfile(null);
          }
          if (mounted) {
            setReady(true);
            setLoading(false);
          }
          return;
        }

        if (event === "TOKEN_REFRESHED") {
          // Just update user object silently — don't flash UI
          setUser(u);
          return;
        }

        if (event === "SIGNED_IN") {
          // Only handle if this is a NEW sign-in (not the initial session replay)
          setUser(u);
          if (u) {
            setLoading(true);
            const p = await loadProfile(u);
            if (mounted) {
              setProfile(p);
              setLoading(false);
            }
          }
          return;
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          return;
        }
      }
    );

    // Safety timeout — if Supabase never fires INITIAL_SESSION
    const timeout = setTimeout(() => {
      if (mounted && !initialEventFired.current) {
        console.warn("Auth timed out, proceeding without session");
        setReady(true);
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Redirect to setup if not onboarded — only when ready
  useEffect(() => {
    if (!ready) return;
    if (user && profile && !profile.onboarded && pathname !== "/setup") {
      router.push("/setup");
    }
  }, [user, profile, ready, pathname, router]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) console.error("Sign-in failed:", error);
  };

  const signInWithIdToken = async ({ provider, token }: { provider: "google"; token: string }) => {
    const { error } = await supabase.auth.signInWithIdToken({
      provider,
      token,
    });
    if (error) console.error("ID token sign-in failed:", error);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/");
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...data, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from("users")
      .update(updated)
      .eq("id", user.id);
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
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        ready,
        signInWithGoogle,
        signInWithIdToken,
        logout,
        updateProfile,
        checkUsernameAvailable,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
