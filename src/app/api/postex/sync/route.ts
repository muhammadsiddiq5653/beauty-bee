/**
 * POST /api/postex/sync
 * Syncs order statuses from PostEx using the List Orders API (3.16).
 * Fetches all active PostEx orders for the past 60 days and updates
 * Firestore for any that have changed. Called by Vercel Cron hourly.
 */
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdminToken } from "@/lib/adminAuth";
import { fsPatch, fsQueryActiveOrders } from "@/lib/firestoreRest";
import { listOrders, mapPostexStatusToOrderStatus } from "@/lib/postex";

export async function POST(req: NextRequest) {
  try {
    const token = await requireAdminToken(req);

    // Fetch active orders (not yet delivered/returned/cancelled) from Firestore
    const activeOrders = await fsQueryActiveOrders(token);
    if (activeOrders.length === 0) {
      return NextResponse.json({ ok: true, synced: 0, message: "No active orders to sync" });
    }

    // Build a map: trackingNumber → { orderId, currentStatus }
    const trackingMap = new Map<string, { orderId: string; currentStatus: string }>();
    for (const order of activeOrders) {
      const tracking = order.postexTrackingNumber as string | undefined;
      if (tracking) {
        trackingMap.set(tracking, {
          orderId: order.id as string,
          currentStatus: order.status as string,
        });
      }
    }

    // Fetch the last 60 days of orders from PostEx (covers all active shipments)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 60);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const postexOrders = await listOrders(fmt(fromDate), fmt(toDate), 0);

    let synced = 0;
    let unchanged = 0;
    const failed: Array<{ tracking: string; error: string }> = [];

    for (const item of postexOrders) {
      const entry = trackingMap.get(item.trackingNumber);
      if (!entry) continue; // not one of our active orders

      const history = item.trackingResponse?.transactionStatusHistory ?? [];
      const latestCode = history[history.length - 1]?.transactionStatusMessageCode ?? "";
      const newStatus = mapPostexStatusToOrderStatus(latestCode, item.trackingResponse?.transactionStatus);

      if (newStatus === entry.currentStatus) {
        unchanged++;
        continue;
      }

      try {
        await fsPatch("orders", entry.orderId, {
          status: newStatus,
          postexOrderStatus: item.trackingResponse?.transactionStatus ?? "",
          updatedAt: new Date().toISOString(),
        }, token);
        synced++;
      } catch (err) {
        failed.push({
          tracking: item.trackingNumber,
          error: err instanceof Error ? err.message : "Patch failed",
        });
      }
    }

    return NextResponse.json({ ok: true, synced, unchanged, failed });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
