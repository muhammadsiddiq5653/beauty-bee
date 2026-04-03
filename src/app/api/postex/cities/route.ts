import { NextResponse } from "next/server";
import { getOperationalCities } from "@/lib/postex";

export async function GET() {
  try {
    const cities = await getOperationalCities("Delivery");
    return NextResponse.json({ ok: true, cities });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Fallback static list when token not configured
    return NextResponse.json({ ok: false, error: msg, cities: [] });
  }
}
