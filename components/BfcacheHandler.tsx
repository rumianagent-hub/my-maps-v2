"use client";

import { useEffect } from "react";

/**
 * Safari aggressively uses bfcache (back-forward cache) which freezes JS state.
 * When restoring from bfcache, React/Query state is stale and often broken.
 * The most reliable fix: reload the page on bfcache restore.
 */
export function BfcacheHandler() {
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from bfcache — JS state is frozen/stale
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  return null;
}
