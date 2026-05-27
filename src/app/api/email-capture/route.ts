import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Sanitize referer: only store the origin/path, not arbitrary header values
    const rawReferer = req.headers.get("referer") ?? "";
    let source = "website";
    try {
      source = rawReferer ? new URL(rawReferer).pathname.slice(0, 100) : "website";
    } catch { /* invalid URL — use default */ }

    await addDoc(collection(db, "email_subscribers"), {
      email: email.toLowerCase().trim(),
      source,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email capture error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
