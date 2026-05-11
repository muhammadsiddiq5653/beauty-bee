import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await addDoc(collection(db, "email_subscribers"), {
      email: email.toLowerCase().trim(),
      source: req.headers.get("referer") || "website",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email capture error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
