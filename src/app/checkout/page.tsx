"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Truck, Shield, CheckCircle, RefreshCw, ShoppingBag, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import PromoCodeField from "@/components/PromoCodeField";
import WhatsAppButton from "@/components/WhatsAppButton";

const DELIVERY = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");

const FALLBACK_CITIES = [
  "Abbottabad","Attock","Awaran","Badin","Bahawalnagar","Bahawalpur",
  "Bannu","Batkhela","Bhakkar","Burewala","Chakwal","Charsadda",
  "Chiniot","Chishtian","Dera Ghazi Khan","Dera Ismail Khan","Faisalabad",
  "Fateh Jang","Ghotki","Gilgit","Gojra","Gujranwala","Gujrat",
  "Hafizabad","Haripur","Hub","Hunza","Hyderabad","Islamabad",
  "Jacobabad","Jhelum","Kamalia","Kamoke","Karachi","Kasur",
  "Khanewal","Kharian","Khushab","Kohat","Kot Addu","Lahore",
  "Larkana","Layyah","Lodhran","Mandi Bahauddin","Mansehra","Mardan",
  "Mianwali","Mingora","Mirpur","Mirpur Khas","Multan","Muzaffarabad",
  "Muzaffargarh","Nawabshah","Nowshera","Okara","Pakpattan","Peshawar",
  "Quetta","Rahim Yar Khan","Rawalpindi","Sadiqabad","Sahiwal",
  "Sargodha","Sheikhupura","Shikarpur","Sialkot","Sukkur","Swabi",
  "Swat","Tando Adam","Tando Allahyar","Toba Tek Singh","Turbat",
  "Umerkot","Vehari","Wah Cantt","Zhob",
].sort();

type SuccessData = {
  refNumber: string;
  trackingNumber: string | null;
  total: number;
};
interface PromoResult {
  code: string; label: string; discount: number; type: "percent" | "fixed"; value: number;
}

const inputClass = "w-full border border-[#EDE8E4] rounded-2xl px-4 py-3 text-sm bg-[#FAF7F4] focus:outline-none focus:border-[#9B2B47] transition-colors placeholder:text-[#6B6B6B]/50";
const labelClass = "text-xs font-medium text-[#6B6B6B] block mb-1.5";

export default function CheckoutPage() {
  const { items, subtotal, itemCount, clearCart } = useCartStore();
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const discount = promo?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal() + DELIVERY - discount);
  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    cityName: "",
    transactionNotes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

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

  function validate() {
    if (!items.length) return "Your cart is empty.";
    if (!form.customerName.trim()) return "Please enter your full name.";
    if (!/^03\d{9}$/.test(form.customerPhone)) return "Please enter a valid phone number (03XXXXXXXXX).";
    if (!form.customerEmail.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) return "Please enter a valid email address.";
    if (!form.deliveryAddress.trim()) return "Please enter your delivery address.";
    if (!form.cityName) return "Please select your city.";
    return null;
  }

  async function placeOrder() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(""); setLoading(true);
    const orderItems = items.map(i => ({ key: i.key, name: i.name, qty: i.qty, unitPrice: i.unitPrice, shade: i.shade }));
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: orderItems, promoCode: promo?.code, discount }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccess({
        refNumber: data.refNumber,
        trackingNumber: data.trackingNumber,
        total: data.total,
      });
      clearCart();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF7F4]">
        <StoreNav /><CartDrawer />
        <div className="max-w-lg mx-auto px-5 py-12">
          <div className="bg-white rounded-3xl border border-[#EDE8E4] p-8 text-center">
            <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="font-serif font-bold text-2xl text-[#1A1A1A] mb-2">Order Placed!</h1>
            <p className="text-[#6B6B6B] text-sm mb-7 leading-relaxed">
              Your order is confirmed and being processed.<br />
              A confirmation email with your order details has been sent to you.
            </p>

            <div className="space-y-3 mb-7">
              <div className="bg-[#F9ECF0] rounded-2xl p-4 border border-[#EDE8E4]">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wide mb-1">Order Reference</p>
                <p className="font-serif font-bold text-[#9B2B47] text-xl">{success.refNumber}</p>
              </div>
              {success.trackingNumber && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wide mb-1">PostEx Tracking</p>
                  <p className="font-bold text-blue-700 text-lg">{success.trackingNumber}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">Track at postex.pk</p>
                </div>
              )}
              <div className="bg-[#FAF7F4] rounded-2xl p-4 border border-[#EDE8E4]">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wide mb-1">Amount to Pay on Delivery</p>
                <p className="font-serif font-bold text-[#9B2B47] text-2xl">Rs. {success.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/track"
                className="btn-ripple w-full bg-[#9B2B47] hover:bg-[#7D1E35] text-white rounded-full py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                <Truck size={15} /> Track My Order
              </Link>
              <Link href="/shop"
                className="w-full bg-[#FAF7F4] border border-[#EDE8E4] text-[#6B6B6B] hover:text-[#9B2B47] rounded-full py-3 font-medium text-center text-sm transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────────
  if (itemCount() === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F4]">
        <StoreNav /><CartDrawer />
        <div className="max-w-lg mx-auto px-5 py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F9ECF0] rounded-2xl mb-4">
            <ShoppingBag size={28} className="text-[#9B2B47]" />
          </div>
          <h1 className="font-serif font-bold text-xl text-[#1A1A1A] mb-2">Your cart is empty</h1>
          <p className="text-[#6B6B6B] text-sm mb-6">Add some products before checking out</p>
          <Link href="/shop"
            className="inline-flex items-center gap-2 bg-[#9B2B47] hover:bg-[#7D1E35] text-white px-8 py-3 rounded-full font-semibold text-sm transition-colors">
            <Package size={15} /> Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <StoreNav />
      <CartDrawer />
      <WhatsAppButton />

      <div className="max-w-lg mx-auto px-5 py-6 pb-16">
        <Link href="/shop" className="inline-flex items-center gap-1 text-[#6B6B6B] hover:text-[#9B2B47] text-sm font-medium mb-5 transition-colors">
          <ChevronLeft size={15} /> Back to Shop
        </Link>

        <h1 className="font-serif font-bold text-2xl text-[#1A1A1A] mb-6">Checkout</h1>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-7">
          {(["Order Review", "Your Details"] as const).map((s, i) => (
            <button key={s} onClick={() => setStep((i + 1) as 1 | 2)}
              className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                step === i + 1
                  ? "bg-[#9B2B47] text-white border-[#9B2B47]"
                  : "bg-white text-[#6B6B6B] border-[#EDE8E4] hover:border-[#9B2B47]/30"
              }`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* ── Step 1: Order Review ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-[#EDE8E4] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#EDE8E4]">
                <h2 className="font-serif font-bold text-[#1A1A1A]">Your Order ({itemCount()} {itemCount() === 1 ? "item" : "items"})</h2>
              </div>
              <div className="divide-y divide-[#EDE8E4]">
                {items.map(item => (
                  <div key={item.key} className="flex items-center gap-3 px-5 py-4">
                    <div className="w-12 h-12 bg-[#F2EDE8] rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.imageUrl
                        ? <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="object-cover w-full h-full rounded-2xl" />
                        : <span className="text-2xl">{item.emoji ?? "🛍️"}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A1A] text-sm truncate">{item.name}</p>
                      {item.shade && <p className="text-xs text-[#6B6B6B]">{item.shade}</p>}
                      <p className="text-xs text-[#6B6B6B]">Qty: {item.qty} × Rs. {item.unitPrice.toLocaleString()}</p>
                    </div>
                    <p className="font-semibold text-[#9B2B47] text-sm flex-shrink-0">
                      Rs. {(item.qty * item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-[#FAF7F4] space-y-2 border-t border-[#EDE8E4]">
                <div className="flex justify-between text-sm text-[#6B6B6B]">
                  <span>Subtotal</span><span>Rs. {subtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-[#6B6B6B]">
                  <span>Delivery (PostEx)</span><span>Rs. {DELIVERY}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Promo ({promo?.code})</span><span>−Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#9B2B47] text-base border-t border-[#EDE8E4] pt-2">
                  <span>Total (COD)</span><span>Rs. {finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#EDE8E4] p-5">
              <p className="text-xs font-medium text-[#6B6B6B] mb-3">Have a promo code?</p>
              <PromoCodeField subtotal={subtotal()} onApply={setPromo} applied={promo} />
            </div>

            <div className="bg-[#FAF7F4] border border-[#EDE8E4] rounded-3xl p-4 flex items-start gap-3">
              <Shield size={16} className="text-[#9B2B47] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#1A1A1A] text-sm">Cash on Delivery</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">Pay Rs. {finalTotal.toLocaleString()} when your order arrives. No prepayment needed.</p>
              </div>
            </div>

            <button onClick={() => setStep(2)}
              className="btn-ripple w-full py-4 bg-[#9B2B47] hover:bg-[#7D1E35] text-white rounded-full font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              Continue to Details →
            </button>
          </div>
        )}

        {/* ── Step 2: Customer Details ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-[#EDE8E4] p-5 space-y-4">
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">Delivery Details</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                  <Shield size={13} /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input type="text" placeholder="e.g. Fatima Ahmed"
                    value={form.customerName}
                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input type="tel" placeholder="03XXXXXXXXX" maxLength={11}
                    value={form.customerPhone}
                    onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                    className={inputClass} />
                  <p className="text-[11px] text-[#6B6B6B] mt-1">11 digits starting with 03</p>
                </div>
                <div>
                  <label className={labelClass}>Email Address * <span className="text-[#6B6B6B]/60">(order confirmation sent here)</span></label>
                  <input type="email" placeholder="e.g. fatima@gmail.com"
                    value={form.customerEmail}
                    onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Delivery Address *</label>
                  <textarea placeholder="House No., Street, Area..."
                    value={form.deliveryAddress}
                    onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
                    rows={2}
                    className={`${inputClass} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>City *</label>
                    <select value={form.cityName} onChange={e => setForm({ ...form, cityName: e.target.value })}
                      className={inputClass}>
                      <option value="">Select city...</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Payment</label>
                    <div className={`${inputClass} text-[#6B6B6B]`}>Cash on Delivery</div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Special Instructions (optional)</label>
                  <input type="text" placeholder="e.g. Call before delivery"
                    value={form.transactionNotes}
                    onChange={e => setForm({ ...form, transactionNotes: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
            </div>

            {/* Mini order summary */}
            <div className="bg-white border border-[#EDE8E4] rounded-3xl px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-[#6B6B6B]">
                  {itemCount()} {itemCount() === 1 ? "item" : "items"} · Cash on Delivery
                  {discount > 0 && <span className="text-green-600"> · −Rs. {discount.toLocaleString()} off</span>}
                </p>
                <p className="font-serif font-bold text-[#9B2B47] text-lg">Rs. {finalTotal.toLocaleString()}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-[#9B2B47] font-medium hover:underline underline-offset-2">
                Edit order
              </button>
            </div>

            <button onClick={placeOrder} disabled={loading}
              className="btn-ripple w-full py-4 bg-[#9B2B47] hover:bg-[#7D1E35] text-white rounded-full font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {loading
                ? <><RefreshCw size={16} className="animate-spin" /> Placing Order...</>
                : <>Place Order — Rs. {finalTotal.toLocaleString()}</>
              }
            </button>
            <p className="text-center text-xs text-[#6B6B6B]">
              Confirmation email sent · PostEx tracking generated automatically
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
