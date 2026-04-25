/**
 * POST /api/orders/create
 * Creates order in Firestore, books on PostEx, sends email notifications.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createOrder } from "@/lib/firestore";
import { createPostexOrder } from "@/lib/postex";
import type { Order } from "@/types";

const DELIVERY_CHARGE = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "orders@beautybee.pk";
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? "";

// ── Email templates ──────────────────────────────────────────────

function businessEmailHtml(order: {
  refNumber: string;
  trackingNumber: string | null;
  customerName: string;
  customerPhone: string;
  cityName: string;
  deliveryAddress: string;
  transactionNotes: string;
  itemSummary: string;
  subtotal: number;
  total: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #EDE8E4;overflow:hidden">
    <div style="background:#9B2B47;padding:24px 28px">
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.1em;text-transform:uppercase">New Order</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:700">${order.refNumber}</h1>
      ${order.trackingNumber ? `<p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">PostEx: ${order.trackingNumber}</p>` : ""}
    </div>
    <div style="padding:24px 28px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px;width:40%">Customer</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${order.customerName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">Phone</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${order.customerPhone}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">City</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${order.cityName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">Address</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${order.deliveryAddress}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">Items</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${order.itemSummary}</td>
        </tr>
        ${order.transactionNotes ? `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">Notes</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;color:#1A1A1A">${order.transactionNotes}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:12px 0 0;color:#6B6B6B;font-size:13px">Subtotal</td>
          <td style="padding:12px 0 0;font-size:13px;color:#1A1A1A">Rs. ${order.subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#6B6B6B;font-size:13px">Delivery</td>
          <td style="padding:4px 0;font-size:13px;color:#1A1A1A">Rs. ${DELIVERY_CHARGE}</td>
        </tr>
        <tr>
          <td style="padding:8px 0 0;font-size:15px;font-weight:700;color:#9B2B47">Total (COD)</td>
          <td style="padding:8px 0 0;font-size:15px;font-weight:700;color:#9B2B47">Rs. ${order.total.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <div style="padding:16px 28px;background:#FAF7F4;border-top:1px solid #EDE8E4">
      <p style="margin:0;font-size:11px;color:#6B6B6B">Beauty Bee Admin · View full details in your dashboard</p>
    </div>
  </div>
</body>
</html>`;
}

function customerEmailHtml(order: {
  refNumber: string;
  trackingNumber: string | null;
  customerName: string;
  itemSummary: string;
  total: number;
  whatsappNumber: string;
}) {
  const waMessage = encodeURIComponent(
    `Hi Beauty Bee! I'd like to confirm my order:\n\nRef: ${order.refNumber}\nName: ${order.customerName}\nItems: ${order.itemSummary}\nTotal (COD): Rs. ${order.total.toLocaleString()}\n\nPlease confirm. Thank you!`
  );
  const waLink = `https://wa.me/${order.whatsappNumber}?text=${waMessage}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #EDE8E4;overflow:hidden">
    <div style="background:#9B2B47;padding:24px 28px;text-align:center">
      <p style="margin:0;font-size:28px">🐝</p>
      <h1 style="margin:8px 0 4px;color:#fff;font-size:20px;font-weight:700">Order Confirmed!</h1>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px">Thank you, ${order.customerName}. We've received your order.</p>
    </div>
    <div style="padding:24px 28px">
      <div style="background:#F9ECF0;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
        <p style="margin:0;font-size:11px;color:#6B6B6B;letter-spacing:0.1em;text-transform:uppercase">Order Reference</p>
        <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#9B2B47">${order.refNumber}</p>
      </div>
      ${order.trackingNumber ? `
      <div style="background:#EFF6FF;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
        <p style="margin:0;font-size:11px;color:#6B6B6B;letter-spacing:0.1em;text-transform:uppercase">PostEx Tracking</p>
        <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#1D4ED8">${order.trackingNumber}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#6B6B6B">Track at postex.pk</p>
      </div>` : ""}
      <div style="background:#FAF7F4;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center">
        <p style="margin:0;font-size:11px;color:#6B6B6B;letter-spacing:0.1em;text-transform:uppercase">Amount to Pay on Delivery</p>
        <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:#9B2B47">Rs. ${order.total.toLocaleString()}</p>
      </div>
      <p style="margin:0 0 16px;font-size:13px;color:#6B6B6B;text-align:center;line-height:1.6">
        Your order has been booked with PostEx and will be delivered in <strong>2–5 working days</strong>.<br>
        Please confirm your order by tapping the button below.
      </p>
      <div style="text-align:center">
        <a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600">
          ✓ Confirm Order on WhatsApp
        </a>
      </div>
    </div>
    <div style="padding:16px 28px;background:#FAF7F4;border-top:1px solid #EDE8E4;text-align:center">
      <p style="margin:0;font-size:11px;color:#6B6B6B">Beauty Bee · Pakistan's Favourite Organic Tint · 🐝</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Route handler ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName, customerPhone, customerEmail,
      deliveryAddress, cityName, transactionNotes, items,
      promoCode, discount,
    } = body;

    if (!customerName || !customerPhone || !deliveryAddress || !cityName || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const refNumber = "BB-" + Date.now().toString().slice(-8);
    const subtotal: number = items.reduce((s: number, i: { qty: number; unitPrice: number }) => s + i.qty * i.unitPrice, 0);
    const discountAmount = Number(discount ?? 0);
    const total = Math.max(0, subtotal + DELIVERY_CHARGE - discountAmount);
    const pieceCount: number = items.reduce((s: number, i: { qty: number }) => s + i.qty, 0);
    const itemSummary: string = items.map((i: { name: string; qty: number; shade?: string }) =>
      `${i.name}${i.shade ? ` (${i.shade})` : ""} ×${i.qty}`
    ).join(", ");

    const orderData: Omit<Order, "id"> = {
      refNumber,
      status: "pending",
      customerName,
      customerPhone,
      customerEmail: customerEmail ?? "",
      deliveryAddress,
      cityName,
      transactionNotes: transactionNotes ?? "",
      items,
      itemSummary,
      pieceCount,
      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      discount: discountAmount,
      promoCode: promoCode ?? "",
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to Firestore
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
      const { updateOrder } = await import("@/lib/firestore");
      await updateOrder(orderId, {
        postexTrackingNumber: dist.trackingNumber,
        postexOrderStatus:    dist.orderStatus,
        postexOrderDate:      dist.orderDate,
        status:               "booked",
      });
    } catch (pErr: unknown) {
      postexError = pErr instanceof Error ? pErr.message : "PostEx booking failed";
    }

    // 3. Send emails (fire-and-forget — don't block the response)
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
    const emailPromises: Promise<unknown>[] = [];

    // Email to business owner
    if (NOTIFY_EMAIL) {
      emailPromises.push(
        resend.emails.send({
          from: FROM,
          to: NOTIFY_EMAIL,
          subject: `🐝 New Order ${refNumber} — Rs. ${total.toLocaleString()} — ${customerName}`,
          html: businessEmailHtml({
            refNumber,
            trackingNumber,
            customerName,
            customerPhone,
            cityName,
            deliveryAddress,
            transactionNotes: transactionNotes ?? "",
            itemSummary,
            subtotal,
            total,
          }),
        })
      );
    }

    // Email to customer (if they provided one)
    if (customerEmail) {
      emailPromises.push(
        resend.emails.send({
          from: FROM,
          to: customerEmail,
          subject: `Your Beauty Bee order is confirmed — ${refNumber}`,
          html: customerEmailHtml({
            refNumber,
            trackingNumber,
            customerName,
            itemSummary,
            total,
            whatsappNumber,
          }),
        })
      );
    }

    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      ok: true,
      orderId,
      refNumber,
      trackingNumber,
      total,
      postexError,
      whatsappNumber,
      itemSummary,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
