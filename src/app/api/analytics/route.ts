import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const EVENT_RE = /^[a-z0-9_:-]{1,80}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = typeof body.event === "string" ? body.event.slice(0, 80) : "";
    if (!EVENT_RE.test(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    await addDoc(collection(db, "analytics_events"), {
      event,
      path: typeof body.path === "string" ? body.path.slice(0, 180) : "",
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 300) : "",
      payload: typeof body.payload === "object" && body.payload ? body.payload : {},
      userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? "",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
