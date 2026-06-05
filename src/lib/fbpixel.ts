// Meta (Facebook) Pixel event helper.
//
// The base pixel + automatic PageView are loaded in src/app/layout.tsx, gated on
// NEXT_PUBLIC_FB_PIXEL_ID. These helpers fire the standard e-commerce events so that
// ad campaigns can optimise toward buyers and so website visitors can be retargeted.
//
// Every call is a safe no-op when the pixel isn't loaded (e.g. no ID configured, or
// during SSR), so it's harmless to call from anywhere on the client.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const PIXEL_CURRENCY = "PKR";

type PixelParams = Record<string, unknown>;

/** Safely fire a standard Meta Pixel event. No-ops if the pixel isn't available. */
export function trackPixel(event: string, params: PixelParams = {}): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;
  try {
    fbq("track", event, params);
  } catch {
    /* never let analytics break the UI */
  }
}
