/**
 * GET /api/postex/track?tracking=CX-XXXXXXXXXXXX
 * Tracks a PostEx order and syncs status to Firestore.
 */
import { NextRequest, NextResponse } from "next/server";
import { trackOrder, mapPostexStatus, mapPostexStatusToOrderStatus } from "@/lib/postex";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";
import { fsPatch } from "@/lib/firestoreRest";

export async function GET(req: NextRequest) {
  const tracking = req.nextUrl.searchParams.get("tracking");
  if (!tracking) return NextResponse.json({ error: "tracking param required" }, { status: 400 });
  const orderId = req.nextUrl.searchParams.get("orderId");

  try {
    const dist = await trackOrder(tracking);

    // Map the latest status code → internal status
    const history = dist.transactionStatusHistory ?? [];
    const latestCode = history[history.length - 1]?.transactionStatusMessageCode;
    const readableStatus = mapPostexStatus(latestCode ?? "");
    const internalStatus = mapPostexStatusToOrderStatus(latestCode ?? "", dist.transactionStatus);

    if (orderId) {
      const token = await requireAdminToken(req);
      await fsPatch("orders", orderId, {
        status: internalStatus,
        postexOrderStatus: dist.transactionStatus,
        updatedAt: new Date().toISOString(),
      }, token);
    }

    return NextResponse.json({
      ok: true,
      tracking: dist.trackingNumber,
      customerName: dist.customerName,
      cityName: dist.cityName,
      status: dist.transactionStatus,
      internalStatus,
      latestStatus: readableStatus,
      history: history.map(h => ({
        message: h.transactionStatusMessage,
        code: h.transactionStatusMessageCode,
        readable: mapPostexStatus(h.transactionStatusMessageCode),
      })),
      invoicePayment: dist.invoicePayment,
      orderRefNumber: dist.orderRefNumber,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
