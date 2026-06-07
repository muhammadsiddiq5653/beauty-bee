import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

const EVENT_RE = /^[a-z0-9_:-]{1,80}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = typeof body.event === "string" ? body.event.slice(0, 80) : "";
    if (!EVENT_RE.test(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    // Only allow a flat object of string/number/boolean primitives in payload
    const rawPayload = typeof body.payload === "object" && body.payload && !Array.isArray(body.payload)
      ? body.payload as Record<string, unknown>
      : {};
    const safePayload: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(rawPayload).slice(0, 20)) {
      if (typeof v === "string") safePayload[k.slice(0, 40)] = v.slice(0, 200);
      else if (typeof v === "number" || typeof v === "boolean") safePayload[k.slice(0, 40)] = v;
    }

    await addDoc(collection(db, "analytics_events"), {
      event,
      path: typeof body.path === "string" ? body.path.slice(0, 180) : "",
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 300) : "",
      payload: safePayload,
      userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? "",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.warn("[analytics] event skipped", {
      error: err instanceof Error ? err.message : "Unknown analytics write error",
      hint: "If this is PERMISSION_DENIED in production, deploy firestore.rules to Firebase; Vercel deploys do not update Firestore rules.",
    });
    return new NextResponse(null, { status: 204 });
  }
}
