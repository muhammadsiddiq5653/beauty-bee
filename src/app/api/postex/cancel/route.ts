/**
 * POST /api/postex/cancel
 * Cancels a PostEx order and updates Firestore status.
 */
import { NextRequest, NextResponse } from "next/server";
import { cancelPostexOrder } from "@/lib/postex";
import { getOrder, updateOrder } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  try {
    const { orderId, reason } = await req.json();
    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.postexTrackingNumber) {
      // Not yet on PostEx — just mark cancelled in Firestore
      await updateOrder(orderId, { status: "cancelled" });
      return NextResponse.json({ ok: true });
    }
    await cancelPostexOrder(order.postexTrackingNumber, reason);
    await updateOrder(orderId, { status: "cancelled" });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
