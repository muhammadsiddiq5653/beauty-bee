import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";
import { createSessionCookie, COOKIE_NAME } from "@/lib/session";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 8 * 60 * 60, // 8 hours in seconds
};

// POST /api/admin/session — exchange a Firebase ID token for a session cookie
export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const adminUid = process.env.ADMIN_UID!;
    const cookie = await createSessionCookie(adminUid);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, cookie, COOKIE_OPTS);
    return res;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Session creation failed" }, { status: 500 });
  }
}

// DELETE /api/admin/session — clear the session cookie on logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
