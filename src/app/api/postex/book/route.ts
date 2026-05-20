/**
 * POST /api/postex/book
 * Books an order on PostEx and updates Firestore.
 * Body: { orderId: string }  (Firestore order ID)
 * Requires: Authorization: Bearer <firebase-id-token>
 */
import { NextRequest, NextResponse } from "next/server";
import { createPostexOrder } from "@/lib/postex";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";
import { fsGet, fsPatch } from "@/lib/firestoreRest";

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdminToken(req);

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const order = await fsGet("orders", orderId, token);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.postexTrackingNumber) {
      return NextResponse.json({ error: "Already booked", trackingNumber: order.postexTrackingNumber });
    }

    const dist = await createPostexOrder({
      orderRefNumber:    order.refNumber as string,
      invoicePayment:    String(order.total),
      orderDetail:       order.itemSummary as string,
      customerName:      order.customerName as string,
      customerPhone:     order.customerPhone as string,
      deliveryAddress:   order.deliveryAddress as string,
      transactionNotes:  (order.transactionNotes as string) ?? "",
      cityName:          order.cityName as string,
      invoiceDivision:   1,
      items:             order.pieceCount as number,
      pickupAddressCode: process.env.POSTEX_PICKUP_ADDRESS_CODE,
      orderType:         "Normal",
    });

    await fsPatch("orders", orderId, {
      postexTrackingNumber: dist.trackingNumber,
      postexOrderStatus:    dist.orderStatus,
      postexOrderDate:      dist.orderDate,
      status:               "booked",
      updatedAt:            new Date().toISOString(),
    }, token);

    return NextResponse.json({ ok: true, trackingNumber: dist.trackingNumber, orderStatus: dist.orderStatus });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
