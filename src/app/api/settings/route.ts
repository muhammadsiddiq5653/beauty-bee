import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/firestore";

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
