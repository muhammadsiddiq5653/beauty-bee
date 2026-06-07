/**
 * POST /api/orders/create
 * Creates order in Firestore, books on PostEx, sends email notifications.
 * Prices and promo discounts are validated server-side — client values are ignored.
 */
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createOrder, getProducts, getBundles, getStoreSettings } from "@/lib/firestore";
import { createPostexOrder } from "@/lib/postex";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import type { Bundle, Order, OrderItem, Product } from "@/types";

const DELIVERY_CHARGE_FALLBACK = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? "";
const MAX_ITEMS_PER_ORDER = 30;
const MAX_QTY_PER_LINE = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^03\d{9}$/;

type PromoCodeDoc = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  active?: boolean;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
  minOrder?: number;
};

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function h(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  deliveryCharge: number;
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
      ${order.trackingNumber ? `<p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">PostEx: ${h(order.trackingNumber)}</p>` : ""}
    </div>
    <div style="padding:24px 28px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px;width:40%">Customer</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${h(order.customerName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">Phone</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${h(order.customerPhone)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">City</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${h(order.cityName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">Address</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${h(order.deliveryAddress)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">Items</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;font-weight:600;color:#1A1A1A">${h(order.itemSummary)}</td>
        </tr>
        ${order.transactionNotes ? `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;color:#6B6B6B;font-size:13px">Notes</td>
          <td style="padding:8px 0;border-bottom:1px solid #EDE8E4;font-size:13px;color:#1A1A1A">${h(order.transactionNotes)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:12px 0 0;color:#6B6B6B;font-size:13px">Subtotal</td>
          <td style="padding:12px 0 0;font-size:13px;color:#1A1A1A">Rs. ${order.subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#6B6B6B;font-size:13px">Delivery</td>
          <td style="padding:4px 0;font-size:13px;color:#1A1A1A">Rs. ${order.deliveryCharge.toLocaleString()}</td>
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
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #EDE8E4;overflow:hidden">
    <div style="background:#9B2B47;padding:24px 28px;text-align:center">
      <p style="margin:0;font-size:28px">🐝</p>
      <h1 style="margin:8px 0 4px;color:#fff;font-size:20px;font-weight:700">Order Confirmed!</h1>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px">Thank you, ${h(order.customerName)}. We've received your order.</p>
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
      <p style="margin:0;font-size:13px;color:#6B6B6B;text-align:center;line-height:1.6">
        Your order has been booked with PostEx and will be delivered in <strong>2–5 working days</strong>.
      </p>
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
  const requestStartedAt = Date.now();
  const timings: Record<string, number> = {};
  const mark = (name: string, startedAt: number) => {
    timings[name] = Date.now() - startedAt;
  };

  try {
    const body = await req.json();
    const {
      customerName, customerPhone, customerEmail,
      deliveryAddress, cityName, transactionNotes, items,
      promoCode,
    } = body;

    const cleanName = cleanText(customerName, 80);
    const cleanPhone = cleanText(customerPhone, 20);
    const cleanEmail = cleanText(customerEmail, 120).toLowerCase();
    const cleanAddress = cleanText(deliveryAddress, 300);
    const cleanCity = cleanText(cityName, 80);
    const cleanNotes = cleanText(transactionNotes, 240);

    if (!cleanName || !cleanPhone || !cleanAddress || !cleanCity || !Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!PHONE_RE.test(cleanPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json({ error: "Too many items in one order" }, { status: 400 });
    }

    // ── 1. Validate prices server-side ──────────────────────────────
    const catalogueStartedAt = Date.now();
    const [products, bundles, storeSettings] = await Promise.all([getProducts(), getBundles(), getStoreSettings()]);
    mark("catalogueMs", catalogueStartedAt);
    const DELIVERY_CHARGE = storeSettings.deliveryCharge ?? DELIVERY_CHARGE_FALLBACK;
    const catalogue = new Map<string, Product | Bundle>();
    for (const p of products) catalogue.set(p.id, p);
    for (const b of bundles) catalogue.set(b.id, b);

    const validatedItems: OrderItem[] = [];
    for (const item of items as Array<{ productId: string; isBundle?: boolean; key?: string; name: string; qty: number; shade?: string }>) {
      if (!item.productId || typeof item.productId !== "string") {
        return NextResponse.json({ error: "Invalid item: missing productId" }, { status: 400 });
      }
      const catalogueItem = catalogue.get(item.productId);
      if (!catalogueItem || catalogueItem.active === false) {
        return NextResponse.json({ error: "Invalid item in order" }, { status: 400 });
      }
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 });
      }
      const shade = cleanText(item.shade, 60);
      const validatedItem: OrderItem = {
        productId: item.productId,
        isBundle: item.isBundle ?? false,
        name: catalogueItem.name,
        qty,
        unitPrice: catalogueItem.price,
      };
      if (shade) validatedItem.shade = shade;
      validatedItems.push(validatedItem);
    }

    const subtotal = validatedItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);

    // ── 2. Validate promo code server-side ──────────────────────────
    let discountAmount = 0;
    let validatedPromoCode = "";
    let validatedPromoDocId: string | null = null;
    if (promoCode && typeof promoCode === "string") {
      const promoStartedAt = Date.now();
      const normalised = promoCode.trim().toUpperCase();
      const promoSnap = await getDoc(doc(db, "promoCodes", normalised)).catch(() => null);
      mark("promoMs", promoStartedAt);
      const promo = promoSnap?.exists()
        ? {
          id: promoSnap.id,
          ...(promoSnap.data() as PromoCodeDoc),
        }
        : null;
      if (
        promo &&
        promo.active !== false &&
        !(promo.expiresAt && new Date(promo.expiresAt) < new Date()) &&
        !(promo.maxUses && (promo.usedCount ?? 0) >= promo.maxUses) &&
        !(promo.minOrder && subtotal < promo.minOrder)
      ) {
        discountAmount = promo.type === "percent"
          ? Math.round((subtotal * promo.value) / 100)
          : Math.min(promo.value, subtotal);
        validatedPromoCode = promo.code;
        validatedPromoDocId = promo.id;
      }
    }

    const total = Math.max(0, subtotal + DELIVERY_CHARGE - discountAmount);
    const refNumber = "BB-" + Date.now().toString(36).slice(-6).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    const pieceCount = validatedItems.reduce((s, i) => s + i.qty, 0);
    if (pieceCount < 1 || pieceCount > MAX_ITEMS_PER_ORDER * MAX_QTY_PER_LINE) {
      return NextResponse.json({ error: "Invalid item count" }, { status: 400 });
    }
    const itemSummary = validatedItems
      .map(i => `${i.name}${i.shade ? ` (${i.shade})` : ""} ×${i.qty}`)
      .join(", ");

    // Book on PostEx immediately. If booking succeeds, tracking is saved in the
    // initial Firestore create so public checkout does not need update permission.
    let trackingNumber: string | null = null;
    let postexError: string | null = null;
    let postexOrderStatus: string | undefined;
    let postexOrderDate: string | undefined;

    const postexStartedAt = Date.now();
    try {
      const dist = await createPostexOrder({
        orderRefNumber:    refNumber,
        invoicePayment:    String(total),
        orderDetail:       itemSummary,
        customerName:      cleanName,
        customerPhone:     cleanPhone,
        deliveryAddress:   cleanAddress,
        transactionNotes:  cleanNotes,
        cityName:          cleanCity,
        invoiceDivision:   1,
        items:             pieceCount,
        pickupAddressCode: process.env.POSTEX_PICKUP_ADDRESS_CODE,
        orderType:         "Normal",
      });
      trackingNumber = dist.trackingNumber;
      postexOrderStatus = dist.orderStatus;
      postexOrderDate = dist.orderDate;
      mark("postexMs", postexStartedAt);
    } catch (pErr: unknown) {
      postexError = pErr instanceof Error ? pErr.message : "PostEx booking failed";
      mark("postexMs", postexStartedAt);
    }

    const orderData: Omit<Order, "id"> = {
      refNumber,
      status: trackingNumber ? "booked" : "pending",
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerEmail: cleanEmail,
      deliveryAddress: cleanAddress,
      cityName: cleanCity,
      transactionNotes: cleanNotes,
      items: validatedItems,
      itemSummary,
      pieceCount,
      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      discount: discountAmount,
      promoCode: validatedPromoCode,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (trackingNumber) orderData.postexTrackingNumber = trackingNumber;
    if (postexOrderStatus) orderData.postexOrderStatus = postexOrderStatus;
    if (postexOrderDate) orderData.postexOrderDate = postexOrderDate;

    // 1. Save to Firestore
    const firestoreStartedAt = Date.now();
    const orderId = await createOrder(orderData);
    mark("firestoreCreateMs", firestoreStartedAt);

    // Increment promo code usage counter
    if (validatedPromoDocId) {
      updateDoc(doc(db, "promoCodes", validatedPromoDocId), { usedCount: increment(1) }).catch(() => {});
    }

    // 3. Send emails
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    console.log(`[orders/create] ${refNumber} — email config: gmailUser=${gmailUser ? "set" : "MISSING"} gmailPass=${gmailPass ? "set" : "MISSING"} customerEmail=${cleanEmail || "not provided"} NOTIFY_EMAIL=${NOTIFY_EMAIL || "MISSING"}`);

    if (gmailUser && gmailPass) {
      const emailStartedAt = Date.now();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      const emailPromises: Promise<unknown>[] = [];

      if (NOTIFY_EMAIL) {
        emailPromises.push(
          transporter.sendMail({
            from: `"Beauty Bee Orders" <${gmailUser}>`,
            to: NOTIFY_EMAIL,
            subject: `🐝 New Order ${refNumber} — Rs. ${total.toLocaleString()} — ${customerName}`,
            html: businessEmailHtml({
              refNumber, trackingNumber, customerName: cleanName, customerPhone: cleanPhone,
              cityName: cleanCity, deliveryAddress: cleanAddress,
              transactionNotes: cleanNotes,
              itemSummary, subtotal, deliveryCharge: DELIVERY_CHARGE, total,
            }),
          }).then(() => console.log(`[orders/create] business email sent to ${NOTIFY_EMAIL}`))
            .catch(e => console.error(`[orders/create] business email FAILED:`, e))
        );
      }

      if (cleanEmail) {
        emailPromises.push(
          transporter.sendMail({
            from: `"Beauty Bee" <${gmailUser}>`,
            to: cleanEmail,
            subject: `Your Beauty Bee order is confirmed — ${refNumber}`,
            html: customerEmailHtml({
              refNumber, trackingNumber, customerName: cleanName,
              itemSummary, total,
            }),
          }).then(() => console.log(`[orders/create] customer email sent to ${cleanEmail}`))
            .catch(e => console.error(`[orders/create] customer email FAILED:`, e))
        );
      }

      // Fire-and-forget — email failure must not fail the order response
      Promise.allSettled(emailPromises)
        .then(() => mark("emailMs", emailStartedAt))
        .catch(() => {});
    } else {
      console.warn("[orders/create] email skipped — GMAIL_USER or GMAIL_APP_PASSWORD not set");
    }

    timings.totalMs = Date.now() - requestStartedAt;
    console.info("[orders/create:timing]", {
      refNumber,
      orderId,
      trackingCreated: Boolean(trackingNumber),
      postexError,
      ...timings,
    });

    return NextResponse.json({
      ok: true,
      orderId,
      refNumber,
      trackingNumber,
      total,
      postexError,
      itemSummary,
    });
  } catch (err: unknown) {
    console.error("[orders/create:error]", {
      totalMs: Date.now() - requestStartedAt,
      ...timings,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
