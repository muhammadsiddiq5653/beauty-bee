import { NextRequest, NextResponse } from "next/server";
import { generateLoadSheet } from "@/lib/postex";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    await requireAdminToken(req);
    const { trackingNumbers } = await req.json();
    if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      return NextResponse.json({ error: "trackingNumbers array is required" }, { status: 400 });
    }
    if (trackingNumbers.some(n => typeof n !== "string" || n.length > 80) || trackingNumbers.length > 100) {
      return NextResponse.json({ error: "Invalid trackingNumbers" }, { status: 400 });
    }

    const pdfBlob = await generateLoadSheet(trackingNumbers);
    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="LoadSheet-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Failed to generate load sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
