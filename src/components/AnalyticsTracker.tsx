"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const report = () => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      trackEvent("page_view", {
        loadMs: nav ? Math.round(nav.loadEventEnd || nav.duration) : null,
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        transferSize: nav ? nav.transferSize : null,
      });
    };

    if (document.readyState === "complete") report();
    else window.addEventListener("load", report, { once: true });

    return () => window.removeEventListener("load", report);
  }, [pathname]);

  return null;
}

