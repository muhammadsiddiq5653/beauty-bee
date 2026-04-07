/**
 * POST /api/promo/validate
 * Validates a promo code and returns discount info.
 * Codes are defined in PROMO_CODES env var as JSON, or fall back to defaults.
 *
 * PROMO_CODES env format (JSON string):
 * [{"code":"BEAUTY10","type":"percent","value":10,"label":"10% off"},{"code":"FLAT100","type":"fixed","value":100,"label":"Rs. 100 off"}]
 */
import { NextRequest, NextResponse } from "next/server";

interface PromoCode {
  code: string;
  type: "percent" | "fixed";
  value: number;
  label: string;
  minOrder?: number;
  active?: boolean;
}

function getCodes(): PromoCode[] {
  try {
    if (process.env.PROMO_CODES) {
      return JSON.parse(process.env.PROMO_CODES);
    }
  } catch { /* fall through */ }

  // Default codes — change via env in production
  return [
    { code: "BEAUTY10",  type: "percent", value: 10,  label: "10% off your order" },
    { code: "WELCOME50", type: "fixed",   value: 50,  label: "Rs. 50 off",         minOrder: 500 },
    { code: "GLOW100",   type: "fixed",   value: 100, label: "Rs. 100 off",         minOrder: 1000 },
    { code: "BEE20",     type: "percent", value: 20,  label: "20% off your order",  minOrder: 1500 },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ ok: false, error: "Please enter a promo code." }, { status: 400 });
    }

    const codes = getCodes();
    const promo = codes.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active !== false);

    if (!promo) {
      // Delay to prevent enumeration
      await new Promise(r => setTimeout(r, 400));
      return NextResponse.json({ ok: false, error: "Invalid promo code. Please check and try again." }, { status: 404 });
    }

    if (promo.minOrder && subtotal < promo.minOrder) {
      return NextResponse.json({
        ok: false,
        error: `This code requires a minimum order of Rs. ${promo.minOrder.toLocaleString()}.`,
      }, { status: 400 });
    }

    const discount =
      promo.type === "percent"
        ? Math.round((subtotal * promo.value) / 100)
        : Math.min(promo.value, subtotal); // don't discount more than subtotal

    return NextResponse.json({
      ok: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      label: promo.label,
      discount,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
