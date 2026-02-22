"use client";

import { useAuth } from "@/lib/auth-context";
import AddPostForm from "@/components/AddPostForm";
import GoogleMapsLoader from "@/components/GoogleMapsLoader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AddPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => { if (ready && !user) router.push("/"); }, [user, ready, router]);

  if (!ready || !user) return (
    <div className="max-w-lg mx-auto px-4 pt-24 pb-8">
      <div className="shimmer h-8 w-40 rounded-lg mb-6" />
      <div className="shimmer h-48 rounded-2xl mb-4" />
      <div className="shimmer h-12 rounded-xl mb-4" />
      <div className="shimmer h-24 rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-24 pb-8 animate-fade-in">
      <GoogleMapsLoader>
        <AddPostForm />
      </GoogleMapsLoader>
    </div>
  );
}
