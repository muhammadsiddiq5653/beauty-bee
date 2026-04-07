"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Truck, Shield, CheckCircle, RefreshCw, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import PromoCodeField from "@/components/PromoCodeField";

const DELIVERY = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");
const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923000000000";

const FALLBACK_CITIES = [
  "Abbottabad","Bahawalpur","Faisalabad","Gujranwala","Hyderabad",
  "Islamabad","Karachi","Lahore","Multan","Peshawar",
  "Quetta","Rawalpindi","Sahiwal","Sargodha","Sialkot",
];

type SuccessData = { refNumber: string; trackingNumber: string | null; total: number };
interface PromoResult {
  code: string; label: string; discount: number; type: "percent" | "fixed"; value: number;
}

export default function CheckoutPage() {
  const { items, subtotal, itemCount, clearCart } = useCartStore();
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const discount = promo?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal() + DELIVERY - discount);
  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    cityName: "",
    transactionNotes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // step 1 = review, step 2 = fill details

  // Fetch live cities from PostEx
  useEffect(() => {
    fetch("/api/postex/cities")
      .then(r => r.json())
      .then(d => {
        if (d.cities?.length) {
          const live = (d.cities as { isDeliveryCity: string; operationalCityName: string }[])
            .filter(c => c.isDeliveryCity === "true")
            .map(c => c.operationalCityName)
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort();
          if (live.length > 0) setCities(live);
        }
      })
      .catch(() => {});
  }, []);

  const allItems = items;

  function validate() {
    if (!allItems.length) return "Your cart is empty.";
    if (!form.customerName.trim()) return "Please enter your full name.";
    if (!/^03\d{9}$/.test(form.customerPhone)) return "Please enter a valid phone number (03XXXXXXXXX).";
    if (!form.deliveryAddress.trim()) return "Please enter your delivery address.";
    if (!form.cityName) return "Please select your city.";
    return null;
  }

  async function placeOrder() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(""); setLoading(true);

    const orderItems = allItems.map(i => ({
      key: i.key,
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      shade: i.shade,
    }));

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: orderItems, promoCode: promo?.code, discount }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      setSuccess({ refNumber: data.refNumber, trackingNumber: data.trackingNumber, total: data.total });
      clearCart();

      // Auto WhatsApp
      const lines = [
        `🐝 *BEAUTY BEE ORDER — ${data.refNumber}*`,
        data.trackingNumber ? `*PostEx Tracking:* ${data.trackingNumber}` : "",
        ``,
        `*Name:* ${form.customerName}`,
        `*Phone:* ${form.customerPhone}`,
        `*City:* ${form.cityName}`,
        `*Address:* ${form.deliveryAddress}`,
        ``,
        `*Items:*`,
        ...orderItems.map(i => `• ${i.name} × ${i.qty} = Rs. ${(i.qty * i.unitPrice).toLocaleString()}`),
        ``,
        `*Delivery:* Rs. ${DELIVERY}`,
        `*TOTAL (COD): Rs. ${data.total.toLocaleString()}*`,
      ].filter(Boolean).join("\n");
      setTimeout(() => window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines)}`, "_blank"), 600);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#fdf3f9]">
        <StoreNav />
        <CartDrawer />
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-[#8b0057] mb-2">Order Confirmed! 🎉</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your order has been placed. You&apos;ll receive a WhatsApp confirmation shortly.
            </p>
            <div className="space-y-3 mb-6">
              <div className="bg-pink-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Order Reference</p>
                <p className="font-black text-[#8b0057] text-xl">{success.refNumber}</p>
              </div>
              {success.trackingNumber && (
                <div className="bg-blue-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1">PostEx Tracking Number</p>
                  <p className="font-black text-blue-700 text-xl">{success.trackingNumber}</p>
                  <p className="text-xs text-gray-400 mt-1">Track at postex.pk</p>
                </div>
              )}
              <div className="bg-amber-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Amount to Pay on Delivery</p>
                <p className="font-black text-amber-700 text-2xl">Rs. {success.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/track"
                className="w-full bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white rounded-full py-3 font-black flex items-center justify-center gap-2 hover:opacity-90">
                <Truck size={16} /> Track My Order
              </Link>
              <Link href="/shop"
                className="w-full bg-pink-50 text-[#8b0057] rounded-full py-3 font-bold text-center text-sm hover:bg-pink-100">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────
  if (itemCount() === 0) {
    return (
      <div className="min-h-screen bg-[#fdf3f9]">
        <StoreNav />
        <CartDrawer />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🛍️</div>
          <h1 className="text-xl font-black text-[#8b0057] mb-2">Your cart is empty</h1>
          <p className="text-gray-400 text-sm mb-6">Add some products before checking out</p>
          <Link href="/shop"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-8 py-3 rounded-full font-black hover:opacity-90">
            <ShoppingBag size={16} /> Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf3f9]">
      <StoreNav />
      <CartDrawer />

      <div className="max-w-lg mx-auto px-4 py-4 pb-16">
        {/* Back */}
        <Link href="/shop" className="inline-flex items-center gap-1 text-[#e91e8c] text-sm font-semibold mb-4 hover:underline">
          <ChevronLeft size={16} /> Back to Shop
        </Link>

        <h1 className="text-2xl font-black text-[#8b0057] mb-5">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {["Order Review", "Your Details"].map((s, i) => (
            <button key={s} onClick={() => setStep((i + 1) as 1 | 2)}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${step === i + 1 ? "bg-[#e91e8c] text-white shadow" : "bg-white text-gray-400 border border-gray-200"}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* ── Step 1: Order Review ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-pink-50">
                <h2 className="font-bold text-[#8b0057]">🛍️ Your Order ({itemCount()} items)</h2>
              </div>
              <div className="divide-y divide-pink-50">
                {allItems.map(item => (
                  <div key={item.key} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="object-cover w-full h-full rounded-xl" />
                      ) : (
                        <span className="text-2xl">{item.emoji ?? "🛍️"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#8b0057] text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.qty} × Rs. {item.unitPrice.toLocaleString()}</p>
                    </div>
                    <p className="font-black text-[#e91e8c] text-sm flex-shrink-0">
                      Rs. {(item.qty * item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              {/* Totals */}
              <div className="px-4 py-3 bg-pink-50 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span><span>Rs. {subtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery (PostEx)</span><span>Rs. {DELIVERY}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>🎉 Promo ({promo?.code})</span><span>-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[#e91e8c] text-base border-t border-pink-200 pt-1.5">
                  <span>Total (COD)</span><span>Rs. {finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Promo code */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <p className="text-xs font-bold text-[#8b0057] flex items-center gap-1.5">🏷️ Have a promo code?</p>
              <PromoCodeField subtotal={subtotal()} onApply={setPromo} applied={promo} />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Shield size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 text-sm">Cash on Delivery</p>
                <p className="text-xs text-amber-600">Pay Rs. {finalTotal.toLocaleString()} when your order arrives. No prepayment needed.</p>
              </div>
            </div>

            <button onClick={() => setStep(2)}
              className="w-full py-4 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white rounded-full font-black text-base shadow-lg hover:opacity-90 flex items-center justify-center gap-2">
              Continue to Details →
            </button>
          </div>
        )}

        {/* ── Step 2: Customer Details ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <h2 className="font-bold text-[#8b0057]">📝 Delivery Details</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#8b0057] block mb-1">Full Name *</label>
                  <input type="text" placeholder="e.g. Fatima Ahmed"
                    value={form.customerName}
                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                    className="w-full border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8b0057] block mb-1">Phone Number *</label>
                  <input type="tel" placeholder="03XXXXXXXXX" maxLength={11}
                    value={form.customerPhone}
                    onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                    className="w-full border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c]" />
                  <p className="text-[11px] text-gray-400 mt-0.5">11 digits starting with 03</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8b0057] block mb-1">Delivery Address *</label>
                  <textarea placeholder="House No., Street, Area..."
                    value={form.deliveryAddress}
                    onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                    rows={2}
                    className="w-full border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c] resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#8b0057] block mb-1">City *</label>
                    <select value={form.cityName} onChange={e => setForm({ ...form, cityName: e.target.value })}
                      className="w-full border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c]">
                      <option value="">Select city...</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8b0057] block mb-1">Payment</label>
                    <div className="border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 text-gray-500">💵 Cash on Delivery</div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8b0057] block mb-1">Special Instructions (optional)</label>
                  <input type="text" placeholder="e.g. Call before delivery"
                    value={form.transactionNotes}
                    onChange={e => setForm({ ...form, transactionNotes: e.target.value })}
                    className="w-full border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c]" />
                </div>
              </div>
            </div>

            {/* Order summary mini */}
            <div className="bg-pink-50 rounded-2xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">
                  {itemCount()} items · COD{discount > 0 ? ` · 🎉 -Rs. ${discount.toLocaleString()} off` : ""}
                </p>
                <p className="font-black text-[#e91e8c]">Rs. {finalTotal.toLocaleString()}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-[#8b0057] font-semibold hover:underline">Edit order</button>
            </div>

            <button onClick={placeOrder} disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white rounded-full font-black text-base shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <><RefreshCw size={18} className="animate-spin" /> Placing Order...</>
              ) : (
                <>🐝 Place Order — Rs. {finalTotal.toLocaleString()}</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400">
              Order confirmed via <span className="text-green-500 font-semibold">WhatsApp</span> + PostEx tracking generated automatically
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
