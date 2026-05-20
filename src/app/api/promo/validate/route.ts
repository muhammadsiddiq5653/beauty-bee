/**
 * POST /api/promo/validate
 * Validates a promo code. Checks Firestore `promoCodes` collection first,
 * then falls back to PROMO_CODES env var, then built-in defaults.
 *
 * Note: Uses Firebase client SDK since firebase-admin is not installed.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface PromoCode {
  code: string;
  type: "percent" | "fixed";
  value: number;
  label?: string;
  minOrder?: number;
  maxUses?: number;
  usedCount?: number;
  active?: boolean;
  expiresAt?: string;
  applicableProductIds?: string[];
}

async function getCodeFromFirestore(code: string): Promise<PromoCode | null> {
  try {
    const snap = await getDoc(doc(db, "promoCodes", code));
    if (!snap.exists()) return null;
    return snap.data() as PromoCode;
  } catch {
    return null;
  }
}

function getDefaultCodes(): PromoCode[] {
  try {
    if (process.env.PROMO_CODES) {
      return JSON.parse(process.env.PROMO_CODES) as PromoCode[];
    }
  } catch { /* fall through */ }

  return [
    { code: "BEAUTY10",  type: "percent", value: 10,  label: "10% off your order",          active: true },
    { code: "WELCOME50", type: "fixed",   value: 50,  label: "Rs. 50 off",  minOrder: 500,  active: true },
    { code: "GLOW100",   type: "fixed",   value: 100, label: "Rs. 100 off", minOrder: 1000, active: true },
    { code: "BEE20",     type: "percent", value: 20,  label: "20% off",     minOrder: 1500, active: true },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal, items } = await req.json() as {
      code: string;
      subtotal: number;
      items?: { productId: string; qty: number; unitPrice: number }[];
    };
    if (!code || typeof code !== "string") {
      return NextResponse.json({ ok: false, error: "Please enter a promo code." }, { status: 400 });
    }

    const normalised = code.trim().toUpperCase();

    // Try the exact Firestore promo document first, then fall back to env/defaults.
    const firestoreCode = await getCodeFromFirestore(normalised);
    const promo = firestoreCode?.active !== false
      ? firestoreCode
      : getDefaultCodes().find(c => c.code.toUpperCase() === normalised && c.active !== false);

    if (!promo) {
      await new Promise(r => setTimeout(r, 400));
      return NextResponse.json({ ok: false, error: "Invalid promo code. Please check and try again." }, { status: 404 });
    }

    // Check expiry
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ ok: false, error: "This promo code has expired." }, { status: 400 });
    }

    // Check usage limit
    if (promo.maxUses && promo.usedCount !== undefined && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ ok: false, error: "This promo code has reached its usage limit." }, { status: 400 });
    }

    // Compute eligible subtotal (restricted to specific products if set)
    const restricted = promo.applicableProductIds && promo.applicableProductIds.length > 0;
    const eligibleSubtotal = restricted && items
      ? items
          .filter(i => promo.applicableProductIds!.includes(i.productId))
          .reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
      : subtotal;

    if (restricted && eligibleSubtotal === 0) {
      return NextResponse.json({
        ok: false,
        error: "This promo code is not applicable to any items in your cart.",
      }, { status: 400 });
    }

    // Check minimum order
    if (promo.minOrder && eligibleSubtotal < promo.minOrder) {
      return NextResponse.json({
        ok: false,
        error: `This code requires a minimum order of Rs. ${promo.minOrder.toLocaleString()}${restricted ? " in eligible products" : ""}.`,
      }, { status: 400 });
    }

    const discount =
      promo.type === "percent"
        ? Math.round((eligibleSubtotal * promo.value) / 100)
        : Math.min(promo.value, eligibleSubtotal);

    const label = promo.label ?? (promo.type === "percent" ? `${promo.value}% off` : `Rs. ${promo.value} off`);

    return NextResponse.json({ ok: true, code: promo.code, type: promo.type, value: promo.value, label, discount });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
