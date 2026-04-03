/**
 * GET /api/postex/track?tracking=CX-XXXXXXXXXXXX
 * Tracks a PostEx order and syncs status to Firestore.
 */
import { NextRequest, NextResponse } from "next/server";
import { trackOrder, mapPostexStatus } from "@/lib/postex";
import { getOrderByTracking, updateOrder } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  const tracking = req.nextUrl.searchParams.get("tracking");
  if (!tracking) return NextResponse.json({ error: "tracking param required" }, { status: 400 });

  try {
    const dist = await trackOrder(tracking);

    // Map the latest status code → internal status
    const history = dist.transactionStatusHistory ?? [];
    const latestCode = history[history.length - 1]?.transactionStatusMessageCode;
    const readableStatus = mapPostexStatus(latestCode ?? "");

    // Update Firestore in background
    getOrderByTracking(tracking).then(order => {
      if (order) {
        updateOrder(order.id, {
          postexOrderStatus: dist.transactionStatus,
        });
      }
    });

    return NextResponse.json({
      ok: true,
      tracking: dist.trackingNumber,
      customerName: dist.customerName,
      cityName: dist.cityName,
      status: dist.transactionStatus,
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
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
