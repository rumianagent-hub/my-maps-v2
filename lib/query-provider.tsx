"use client";

import { QueryClient, QueryClientProvider, focusManager, onlineManager } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Handle Safari's bfcache — when a frozen tab resumes, refetch stale queries
if (typeof window !== "undefined") {
  // Use visibilitychange for tab focus (works better than window focus on mobile Safari)
  focusManager.setEventListener((handleFocus) => {
    const onVisibilityChange = () => handleFocus(document.visibilityState === "visible");
    const onPageShow = (e: PageTransitionEvent) => {
      // bfcache restore — Safari freezes JS when backgrounded
      if (e.persisted) handleFocus(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  });

  // Detect online/offline properly
  onlineManager.setEventListener((setOnline) => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60_000,
            gcTime: 10 * 60_000,
            retry: 1,
            refetchOnWindowFocus: true, // refetch when tab regains focus
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ErrorBoundary>
  );
}
