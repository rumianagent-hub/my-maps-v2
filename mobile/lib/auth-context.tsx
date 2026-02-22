import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { UserProfile } from "./types";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "462710840288-q8cmh1bbktgt755s1mjcho8hbgk0j31e.apps.googleusercontent.com";
const REDIRECT_URI = "https://my-maps-v2.pages.dev/auth/mobile-callback";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const nonceRef = useRef<string>("");

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
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const p = await loadProfile(u);
          if (mounted) setProfile(p);
        } else {
          setProfile(null);
        }
        if (mounted) setLoading(false);
      }
    );

    const timeout = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 3000);

    return () => { mounted = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, [loadProfile]);

  const extractIdToken = (url: string): string | null => {
    // Token could be in hash fragment (#id_token=...) or query params (?id_token=...)
    let paramString = "";
    if (url.includes("#")) {
      paramString = url.split("#")[1];
    }
    if (url.includes("?")) {
      // Could be in query params, or query params after the deep link path
      const qPart = url.split("?").slice(1).join("?");
      if (qPart.includes("id_token")) {
        paramString = qPart;
      }
    }
    if (!paramString) return null;
    const params = new URLSearchParams(paramString);
    return params.get("id_token");
  };

  const signInWithGoogle = async () => {
    // Generate nonce: raw nonce goes to Supabase, SHA256 hash goes to Google
    const rawNonce = Math.random().toString(36).substring(2, 15);
    nonceRef.current = rawNonce;
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const params = new URLSearchParams({
      client_id: GOOGLE_WEB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "id_token",
      scope: "openid profile email",
      nonce: hashedNonce,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log("Opening auth with redirect:", REDIRECT_URI);
    console.log("Nonce:", rawNonce);

    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      "exp://192.168.2.163:8081"
    );

    console.log("Auth result type:", result.type);

    if (result.type === "success" && result.url) {
      console.log("Callback URL:", result.url.substring(0, 200));
      
      const idToken = extractIdToken(result.url);
      
      if (idToken) {
        console.log("Got id_token (length:", idToken.length, "), signing into Supabase with nonce:", nonceRef.current);
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
          nonce: nonceRef.current,
        });
        
        if (error) {
          console.error("Supabase signInWithIdToken error:", error.message, error.status, JSON.stringify(error));
        } else {
          console.log("SUCCESS! Signed in as:", data.user?.email);
        }
      } else {
        console.error("No id_token found in callback URL:", result.url.substring(0, 300));
      }
    } else {
      console.log("Auth was dismissed or failed:", result.type);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...data, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("users").update(updated).eq("id", user.id);
    if (error) throw error;
    setProfile((prev) => prev ? { ...prev, ...updated } as UserProfile : null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
