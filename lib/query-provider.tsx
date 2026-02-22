"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60_000, // 2 min — show stale data immediately, refresh in bg
            gcTime: 10 * 60_000, // 10 min — keep unused data longer
            retry: 1,
            refetchOnWindowFocus: false,
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
