"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { UserProfile } from "./types";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadProfile = useCallback(async (u: User): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", u.id)
      .maybeSingle();
    if (error) { console.error("Failed to load profile:", error); return null; }
    return data as UserProfile | null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await loadProfile(user);
    if (p) setProfile(p);
  }, [user, loadProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const p = await loadProfile(u);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Redirect to setup if not onboarded
  useEffect(() => {
    if (loading) return;
    if (user && profile && !profile.onboarded && pathname !== "/setup") {
      router.push("/setup");
    }
  }, [user, profile, loading, pathname, router]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) console.error("Sign-in failed:", error);
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
    if (error) { console.error("Failed to update profile:", error); throw error; }
    setProfile((prev) => prev ? { ...prev, ...updated } as UserProfile : null);
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
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, updateProfile, checkUsernameAvailable, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
