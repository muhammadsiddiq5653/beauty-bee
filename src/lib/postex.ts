/**
 * PostEx API v4.1.9 client (server-side only)
 * Base URL: https://api.postex.pk/services/integration/api
 * Auth: token header
 */
import type {
  PostexCreateOrderPayload,
  PostexCreateOrderResponse,
  PostexCity,
  PostexTrackingResponse,
} from "@/types";

const BASE = process.env.POSTEX_BASE_URL ?? "https://api.postex.pk/services/integration/api";
const TOKEN = process.env.POSTEX_TOKEN ?? "";

function headers() {
  return {
    "Content-Type": "application/json",
    token: TOKEN,
  };
}

// 3.1 — GET /order/v2/get-operational-city
export async function getOperationalCities(type?: "Pickup" | "Delivery"): Promise<PostexCity[]> {
  const url = new URL(`${BASE}/order/v2/get-operational-city`);
  if (type) url.searchParams.set("operationalCityType", type);
  const res = await fetch(url.toString(), { headers: headers() });
  const data = await res.json();
  if (data.statusCode !== "200") throw new Error(data.statusMessage);
  return data.dist as PostexCity[];
}

// 3.2 — GET /order/v1/get-merchant-address
export async function getPickupAddresses(cityName?: string) {
  const url = new URL(`${BASE}/order/v1/get-merchant-address`);
  if (cityName) url.searchParams.set("cityName", cityName);
  const res = await fetch(url.toString(), { headers: headers() });
  const data = await res.json();
  if (data.statusCode !== "200") throw new Error(data.statusMessage);
  return data.dist;
}

// 3.5 — POST /order/v3/create-order
export async function createPostexOrder(
  payload: PostexCreateOrderPayload
): Promise<PostexCreateOrderResponse["dist"]> {
  const res = await fetch(`${BASE}/order/v3/create-order`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data: PostexCreateOrderResponse = await res.json();
  if (data.statusCode !== "200") throw new Error(data.statusMessage);
  return data.dist;
}

// 3.8 — GET /order/v1/track-order/{trackingNumber}
export async function trackOrder(trackingNumber: string): Promise<PostexTrackingResponse["dist"]> {
  const res = await fetch(`${BASE}/order/v1/track-order/${trackingNumber}`, {
    headers: headers(),
  });
  const data: PostexTrackingResponse = await res.json();
  if (data.statusCode !== "200") throw new Error(data.statusMessage);
  return data.dist;
}

// 3.9 — GET /order/v1/track-bulk-order
export async function trackBulkOrders(trackingNumbers: string[]) {
  const res = await fetch(`${BASE}/order/v1/track-bulk-order`, {
    method: "GET",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ trackingNumber: trackingNumbers }),
  });
  const data = await res.json();
  if (data.statusCode !== "200") throw new Error(data.statusMessage);
  return data.dist;
}

// 3.7 — POST /order/v2/generate-load-sheet  (returns PDF blob)
export async function generateLoadSheet(
  trackingNumbers: string[],
  pickupAddress?: string
): Promise<Blob> {
  const res = await fetch(`${BASE}/order/v2/generate-load-sheet`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ trackingNumbers, pickupAddress }),
  });
  if (!res.ok) throw new Error(`Load sheet error: ${res.status}`);
  return await res.blob();
}

// 3.13 — PUT /order/v1/cancel-order
export async function cancelPostexOrder(trackingNumber: string, reason?: string) {
  const res = await fetch(`${BASE}/order/v1/cancel-order`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ trackingNumber, reason }),
  });
  const data = await res.json();
  if (data.statusCode !== "200") throw new Error(data.statusMessage);
  return data;
}

// 3.6 — GET /order/v2/get-unbooked-orders
export async function getUnbookedOrders(startDate: string, endDate: string) {
  const url = new URL(`${BASE}/order/v2/get-unbooked-orders`);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  const res = await fetch(url.toString(), { headers: headers() });
  const data = await res.json();
  if (data.statusCode !== "200") throw new Error(data.statusMessage);
  return data.dist;
}

// Map PostEx status codes → internal status
export function mapPostexStatus(code: string): string {
  const map: Record<string, string> = {
    "0001": "At Merchant Warehouse",
    "0002": "Returned",
    "0003": "At PostEx Warehouse",
    "0004": "Out for Delivery",
    "0005": "Delivered ✓",
    "0006": "Returned",
    "0007": "Returned",
    "0008": "Delivery Under Review",
    "0013": "Delivery Attempted",
  };
  return map[code] ?? code;
}
