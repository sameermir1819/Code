"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global Realtime & Reactive Sync Listener
 * Listens for campus switches, data mutations, and tab refocus to keep
 * all screens, tables, and KPIs automatically in sync without manual F5 refreshes.
 */
export function RealtimeListener() {
  const router = useRouter();

  useEffect(() => {
    let lastRefreshTime = 0;
    const DEBOUNCE_MS = 300;

    const triggerRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshTime > DEBOUNCE_MS) {
        lastRefreshTime = now;
        router.refresh();
      }
    };

    const handleDataRefresh = () => {
      triggerRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    };

    window.addEventListener("erp-campus-changed", handleDataRefresh);
    window.addEventListener("erp-data-refresh", handleDataRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("erp-campus-changed", handleDataRefresh);
      window.removeEventListener("erp-data-refresh", handleDataRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}

