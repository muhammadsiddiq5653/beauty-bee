/**
 * POST /api/postex/book
 * Books an order on PostEx and updates Firestore.
 * Body: { orderId: string }  (Firestore order ID)
 */
import { NextRequest, NextResponse } from "next/server";
import { createPostexOrder } from "@/lib/postex";
import { getOrder, updateOrder } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.postexTrackingNumber) {
      return NextResponse.json({ error: "Already booked", trackingNumber: order.postexTrackingNumber });
    }

    const dist = await createPostexOrder({
      orderRefNumber:    order.refNumber,
      invoicePayment:    String(order.total),
      orderDetail:       order.itemSummary,
      customerName:      order.customerName,
      customerPhone:     order.customerPhone,
      deliveryAddress:   order.deliveryAddress,
      transactionNotes:  order.transactionNotes ?? "",
      cityName:          order.cityName,
      invoiceDivision:   1,
      items:             order.pieceCount,
      pickupAddressCode: process.env.POSTEX_PICKUP_ADDRESS_CODE,
      orderType:         "Normal",
    });

    await updateOrder(orderId, {
      postexTrackingNumber: dist.trackingNumber,
      postexOrderStatus:    dist.orderStatus,
      postexOrderDate:      dist.orderDate,
      status:               "booked",
    });

    return NextResponse.json({ ok: true, trackingNumber: dist.trackingNumber, orderStatus: dist.orderStatus });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
