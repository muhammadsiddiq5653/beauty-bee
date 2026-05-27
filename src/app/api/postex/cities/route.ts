import { NextResponse } from "next/server";
import { getOperationalCities } from "@/lib/postex";

export async function GET() {
  try {
    const cities = await getOperationalCities("Delivery");
    return NextResponse.json({ ok: true, cities }, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg, cities: [] });
  }
}
