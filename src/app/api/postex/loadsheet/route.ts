import { NextRequest, NextResponse } from "next/server";
import { generateLoadSheet } from "@/lib/postex";

export async function POST(req: NextRequest) {
  try {
    const { trackingNumbers } = await req.json();
    if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      return NextResponse.json({ error: "trackingNumbers array is required" }, { status: 400 });
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
    const message = err instanceof Error ? err.message : "Failed to generate load sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
