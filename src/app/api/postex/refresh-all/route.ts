import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";
import { fsPatch } from "@/lib/firestoreRest";
import { mapPostexStatusToOrderStatus, trackOrder } from "@/lib/postex";

interface RefreshTarget {
  orderId: string;
  trackingNumber: string;
}

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdminToken(req);
    const body = await req.json();
    const orders = Array.isArray(body.orders) ? body.orders as RefreshTarget[] : [];

    if (orders.length === 0) {
      return NextResponse.json({ error: "orders array required" }, { status: 400 });
    }
    if (orders.length > 200) {
      return NextResponse.json({ error: "Refresh up to 200 orders at a time" }, { status: 400 });
    }

    let refreshed = 0;
    const failed: Array<{ orderId: string; error: string }> = [];

    for (const order of orders) {
      if (!order.orderId || !order.trackingNumber) continue;
      try {
        const dist = await trackOrder(order.trackingNumber);
        const history = dist.transactionStatusHistory ?? [];
        const latestCode = history[history.length - 1]?.transactionStatusMessageCode ?? "";
        await fsPatch("orders", order.orderId, {
          status: mapPostexStatusToOrderStatus(latestCode, dist.transactionStatus),
          postexOrderStatus: dist.transactionStatus,
          updatedAt: new Date().toISOString(),
        }, token);
        refreshed++;
      } catch (err: unknown) {
        failed.push({
          orderId: order.orderId,
          error: err instanceof Error ? err.message : "Refresh failed",
        });
      }
    }

    return NextResponse.json({ ok: true, refreshed, failed });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

