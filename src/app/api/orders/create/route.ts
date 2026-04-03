/**
 * POST /api/orders/create
 * Creates order in Firestore, then auto-books on PostEx.
 */
import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/firestore";
import { createPostexOrder } from "@/lib/postex";
import type { Order } from "@/types";

const DELIVERY_CHARGE = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, customerPhone, deliveryAddress,
      cityName, transactionNotes, items,
    } = body;

    if (!customerName || !customerPhone || !deliveryAddress || !cityName || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const refNumber = "BB-" + Date.now().toString().slice(-8);
    const subtotal: number = items.reduce((s: number, i: { qty: number; unitPrice: number }) => s + i.qty * i.unitPrice, 0);
    const total = subtotal + DELIVERY_CHARGE;
    const pieceCount: number = items.reduce((s: number, i: { qty: number }) => s + i.qty, 0);
    const itemSummary: string = items.map((i: { name: string; qty: number }) => `${i.name} x${i.qty}`).join(", ");

    const orderData: Omit<Order, "id"> = {
      refNumber,
      status: "pending",
      customerName,
      customerPhone,
      deliveryAddress,
      cityName,
      transactionNotes: transactionNotes ?? "",
      items,
      itemSummary,
      pieceCount,
      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to Firestore first
    const orderId = await createOrder(orderData);

    // 2. Auto-book on PostEx
    let trackingNumber: string | null = null;
    let postexError: string | null = null;

    try {
      const dist = await createPostexOrder({
        orderRefNumber:    refNumber,
        invoicePayment:    String(total),
        orderDetail:       itemSummary,
        customerName,
        customerPhone,
        deliveryAddress,
        transactionNotes:  transactionNotes ?? "",
        cityName,
        invoiceDivision:   1,
        items:             pieceCount,
        pickupAddressCode: process.env.POSTEX_PICKUP_ADDRESS_CODE,
        orderType:         "Normal",
      });

      trackingNumber = dist.trackingNumber;

      // Update Firestore with PostEx details
      const { updateOrder } = await import("@/lib/firestore");
      await updateOrder(orderId, {
        postexTrackingNumber: dist.trackingNumber,
        postexOrderStatus:    dist.orderStatus,
        postexOrderDate:      dist.orderDate,
        status:               "booked",
      });
    } catch (pErr: unknown) {
      postexError = pErr instanceof Error ? pErr.message : "PostEx booking failed";
      // Order is still saved in Firestore — admin can manually book from dashboard
    }

    return NextResponse.json({
      ok: true,
      orderId,
      refNumber,
      trackingNumber,
      total,
      postexError, // null if successful
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
