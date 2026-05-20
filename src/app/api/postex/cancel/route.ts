/**
 * POST /api/postex/cancel
 * Cancels a PostEx order and updates Firestore status.
 */
import { NextRequest, NextResponse } from "next/server";
import { cancelPostexOrder } from "@/lib/postex";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";
import { fsGet, fsPatch } from "@/lib/firestoreRest";

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdminToken(req);
    const { orderId, reason } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const order = await fsGet("orders", orderId, token);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.postexTrackingNumber) {
      // Not yet on PostEx — just mark cancelled in Firestore
      await fsPatch("orders", orderId, { status: "cancelled", updatedAt: new Date().toISOString() }, token);
      return NextResponse.json({ ok: true });
    }
    await cancelPostexOrder(String(order.postexTrackingNumber), typeof reason === "string" ? reason : undefined);
    await fsPatch("orders", orderId, { status: "cancelled", updatedAt: new Date().toISOString() }, token);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
