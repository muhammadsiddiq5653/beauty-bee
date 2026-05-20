type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    event,
    path: window.location.pathname,
    referrer: document.referrer || "",
    payload,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

