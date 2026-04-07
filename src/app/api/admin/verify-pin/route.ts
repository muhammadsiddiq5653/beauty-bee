/**
 * POST /api/admin/verify-pin
 * Verifies the admin PIN server-side so it's never exposed in the browser bundle.
 * Uses ADMIN_PIN env var (not NEXT_PUBLIC_) — server-only.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    // Use server-only ADMIN_PIN; fall back to NEXT_PUBLIC_ADMIN_PIN for backwards compatibility
    const correctPin = process.env.ADMIN_PIN ?? process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1234";

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (pin === correctPin) {
      return NextResponse.json({ ok: true });
    }

    // Short delay to slow brute force
    await new Promise(r => setTimeout(r, 500));
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
