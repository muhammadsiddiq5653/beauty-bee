"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, ChevronLeft, Package, Truck, Shield, Star } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { DEFAULT_PRODUCTS, DEFAULT_BUNDLES } from "@/lib/catalogue";
import type { Product, Bundle } from "@/types";

const DELIVERY = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");
const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923000000000";

// ─── Product Card ────────────────────────────────────────────────
function ProductCard({ p }: { p: Product }) {
  const [open, setOpen] = useState(false);
  const [shade, setShade] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, items } = useCartStore();

  const inCart = items.some(i => i.productId === p.id);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (p.needsShade && !shade) { alert("Please choose a shade 💕"); return; }
    addItem(p, qty, shade || undefined);
    setAdded(true);
    setTimeout(() => { setAdded(false); setOpen(false); }, 1200);
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${open ? "border-[#e91e8c]" : inCart ? "border-green-400" : "border-transparent hover:border-pink-100"}`}>
      <div className="cursor-pointer relative select-none" onClick={() => setOpen(o => !o)}>
        {inCart && !open && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
        )}
        {p.badge && <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.badgeColor === "green" ? "bg-green-500" : "bg-[#e91e8c]"} text-white`}>{p.badge}</span>}
        <div className="text-4xl text-center pt-4 pb-1">{p.emoji}</div>
        <div className="px-3 pb-3">
          <div className="font-bold text-[#8b0057] text-sm">{p.name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{p.subtitle}</div>
          <div className="mt-1">
            <span className="font-extrabold text-[#e91e8c]">Rs. {p.price.toLocaleString()}</span>
            {p.oldPrice && <span className="text-[11px] text-gray-300 line-through ml-1">Rs. {p.oldPrice.toLocaleString()}</span>}
          </div>
          <div className="mt-1.5 text-[10px] text-[#e91e8c] font-semibold">{open ? "▲ Tap to close" : "▼ Tap to add"}</div>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-pink-50 space-y-2" onClick={e => e.stopPropagation()}>
          {p.needsShade && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1 font-semibold">Choose shade:</p>
              <div className="flex flex-wrap gap-1">
                {p.shades.map(s => (
                  <button key={s.name} onClick={() => setShade(s.name)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border-2 font-semibold transition-all ${shade === s.name ? "bg-[#e91e8c] text-white border-[#e91e8c]" : "border-pink-200 text-[#8b0057]"}`}
                  >{s.name}</button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 mr-1">Qty:</span>
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-6 h-6 rounded-full border-2 border-[#e91e8c] text-[#e91e8c] font-bold text-sm flex items-center justify-center hover:bg-[#e91e8c] hover:text-white">−</button>
            <span className="font-bold text-[#8b0057] text-sm w-5 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-6 h-6 rounded-full border-2 border-[#e91e8c] text-[#e91e8c] font-bold text-sm flex items-center justify-center hover:bg-[#e91e8c] hover:text-white">+</button>
          </div>
          <button onClick={handleAdd}
            className={`w-full py-2 rounded-full text-sm font-bold text-white transition-all shadow ${added ? "bg-green-500" : "bg-[#e91e8c] hover:bg-[#8b0057] active:scale-95"}`}
          >{added ? "✓ Added to Order!" : `+ Add to Order — Rs. ${(p.price * qty).toLocaleString()}`}</button>
        </div>
      )}
    </div>
  );
}

// ─── Bundle Card ─────────────────────────────────────────────────
function BundleCard({ b }: { b: Bundle }) {
  const { selectedBundle, setBundle } = useCartStore();
  const sel = selectedBundle?.id === b.id;
  return (
    <div onClick={() => setBundle(sel ? null : b)}
      className={`bg-white rounded-2xl shadow-sm border-2 p-3 cursor-pointer flex items-center gap-3 transition-all ${sel ? "border-[#e91e8c] bg-pink-50" : "border-transparent hover:border-pink-100"}`}>
      <div className="text-2xl">{b.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[#8b0057] text-sm">{b.name}</div>
        <div className="text-[11px] text-gray-400 truncate">{b.includes}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="font-extrabold text-[#e91e8c] text-sm">Rs. {b.price.toLocaleString()}</span>
          <span className="text-[11px] text-gray-300 line-through">Rs. {b.oldPrice.toLocaleString()}</span>
          <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">Save Rs. {(b.oldPrice - b.price).toLocaleString()}</span>
        </div>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${sel ? "bg-[#e91e8c] border-[#e91e8c] text-white" : "border-gray-200"}`}>{sel ? "✓" : ""}</div>
    </div>
  );
}

// ─── Order Form ──────────────────────────────────────────────────
function OrderForm() {
  const { items, selectedBundle, subtotal, total, itemCount, clearCart } = useCartStore();
  const [cities, setCities] = useState<string[]>([]);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", deliveryAddress: "", cityName: "", transactionNotes: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ refNumber: string; trackingNumber: string | null; total: number } | null>(null);

  const FALLBACK_CITIES = [
    "Abbottabad","Bahawalpur","Faisalabad","Gujranwala","Hyderabad",
    "Islamabad","Karachi","Lahore","Multan","Peshawar",
    "Quetta","Rawalpindi","Sahiwal","Sargodha","Sialkot",
  ];

  useEffect(() => {
    // Set fallback immediately so the dropdown is never empty
    setCities(FALLBACK_CITIES);
    // Try to fetch live PostEx cities and replace if successful
    fetch("/api/postex/cities")
      .then(r => r.json())
      .then(d => {
        if (d.cities?.length) {
          const live = (d.cities as { isDeliveryCity: string; operationalCityName: string }[])
            .filter(c => c.isDeliveryCity === "true")
            .map(c => c.operationalCityName)
            .filter((v, i, a) => a.indexOf(v) === i) // dedupe
            .sort();
          if (live.length > 0) setCities(live);
        }
      })
      .catch(() => {}); // keep fallback on error
  }, []);

  const allItems = [
    ...items,
    ...(selectedBundle ? [{ key: selectedBundle.id, name: selectedBundle.name, qty: 1, unitPrice: selectedBundle.price }] : []),
  ];

  function validate() {
    if (!allItems.length) return "Add at least one product to continue.";
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
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: allItems }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccess({ refNumber: data.refNumber, trackingNumber: data.trackingNumber, total: data.total });
      clearCart();

      // Auto-open WhatsApp
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
        ...allItems.map(i => `• ${i.name} × ${i.qty} = Rs. ${(i.qty * i.unitPrice).toLocaleString()}`),
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

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 text-center mt-4">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-xl font-black text-[#8b0057] mb-2">Order Placed!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Your order is booked and will be delivered Cash on Delivery via PostEx.
        </p>
        {success.trackingNumber && (
          <div className="bg-pink-50 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500">PostEx Tracking Number</p>
            <p className="text-xl font-black text-[#e91e8c]">{success.trackingNumber}</p>
            <p className="text-xs text-gray-400 mt-1">Track at postex.pk</p>
          </div>
        )}
        <div className="bg-pink-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500">Order Reference</p>
          <p className="font-bold text-[#8b0057]">{success.refNumber}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/track" className="bg-[#e91e8c] text-white rounded-full py-2.5 font-bold text-sm hover:bg-[#8b0057] transition-colors text-center">
            Track My Order
          </Link>
          <Link href="/order" className="bg-pink-50 text-[#8b0057] rounded-full py-2.5 font-bold text-sm text-center">
            Shop More
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white rounded-2xl shadow-md p-4 space-y-4">
      {/* Order Summary */}
      <div className="bg-pink-50 rounded-xl p-4">
        <h3 className="font-bold text-[#8b0057] mb-3 text-sm">🛍️ Your Order</h3>
        {allItems.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-2">Select products above to continue</p>
        ) : (
          <div className="space-y-1.5">
            {allItems.map(i => (
              <div key={i.key} className="flex justify-between text-sm">
                <span className="text-gray-700">{i.name}{i.qty > 1 ? ` × ${i.qty}` : ""}</span>
                <span className="font-semibold text-[#8b0057]">Rs. {(i.qty * i.unitPrice).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-pink-200 pt-1.5 mt-1.5 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery (PostEx COD)</span><span>Rs. {DELIVERY}</span>
              </div>
              <div className="flex justify-between font-black text-[#e91e8c]">
                <span>Total (COD)</span><span>Rs. {total().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">⚠️ {error}</div>}

      {/* Fields */}
      {[
        { id: "customerName", label: "Full Name *", type: "text", placeholder: "e.g. Fatima Ahmed" },
        { id: "customerPhone", label: "Phone Number *", type: "tel", placeholder: "03XXXXXXXXX", maxLength: 11 },
      ].map(f => (
        <div key={f.id}>
          <label className="text-xs font-semibold text-[#8b0057] block mb-1">{f.label}</label>
          <input type={f.type} placeholder={f.placeholder} maxLength={f.maxLength}
            value={form[f.id as keyof typeof form]}
            onChange={e => setForm({ ...form, [f.id]: e.target.value })}
            className="w-full border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c] transition-colors"
          />
          {f.id === "customerPhone" && <p className="text-[11px] text-gray-400 mt-0.5">11 digits starting with 03 — no spaces</p>}
        </div>
      ))}

      <div>
        <label className="text-xs font-semibold text-[#8b0057] block mb-1">Delivery Address *</label>
        <textarea placeholder="House No., Street, Area..."
          value={form.deliveryAddress}
          onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
          rows={2}
          className="w-full border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c] resize-none transition-colors"
        />
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
          <div className="border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 text-gray-600">Cash on Delivery</div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-[#8b0057] block mb-1">Special Instructions (optional)</label>
        <input type="text" placeholder="e.g. Call before delivery"
          value={form.transactionNotes}
          onChange={e => setForm({ ...form, transactionNotes: e.target.value })}
          className="w-full border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c]"
        />
      </div>

      <button onClick={placeOrder} disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white rounded-full font-black text-base shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"></span> Booking...</> : "🐝 Place My Order"}
      </button>
      <p className="text-center text-xs text-gray-400">
        Order confirmed via <span className="text-green-500 font-semibold">WhatsApp</span> + PostEx tracking generated automatically
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function OrderPage() {
  const products = DEFAULT_PRODUCTS.map((p, i) => ({ ...p, id: ["tint", "mask", "serum", "soap"][i] })) as Product[];
  const bundles  = DEFAULT_BUNDLES.map((b, i) => ({ ...b, id: ["starter", "glow", "complete", "duo"][i] })) as Bundle[];
  const { itemCount } = useCartStore();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-lg mx-auto px-3 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
            <ChevronLeft size={18}/> Back
          </Link>
          <div className="text-center">
            <div className="font-black">🐝 BEAUTY BEE</div>
            <div className="text-xs opacity-80">Order Now</div>
          </div>
          <div className="text-sm font-bold">
            {itemCount() > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full">{itemCount()} items</span>}
          </div>
        </div>
      </header>

      {/* Trust Row */}
      <div className="max-w-lg mx-auto px-3">
        <div className="flex gap-2 justify-center py-3 flex-wrap">
          {[{i: <Shield size={11}/>, t: "Organic"},{i: <Package size={11}/>, t: "COD"},{i: <Truck size={11}/>, t: "Pakistan-wide"},{i: <Star size={11}/>, t: "500+ Reviews"}].map(b => (
            <div key={b.t} className="flex items-center gap-1 bg-white border border-pink-100 rounded-full px-2.5 py-0.5 text-[11px] text-gray-400">{b.i}{b.t}</div>
          ))}
        </div>

        {/* Products */}
        <h2 className="font-bold text-[#8b0057] flex items-center gap-2 mt-2 mb-2 text-base">
          💄 Products <span className="flex-1 h-0.5 bg-pink-100"></span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {products.map(p => <ProductCard key={p.id} p={p}/>)}
        </div>

        {/* Bundles */}
        <h2 className="font-bold text-[#8b0057] flex items-center gap-2 mt-6 mb-2 text-base">
          🎁 Bundle Deals <span className="flex-1 h-0.5 bg-pink-100"></span>
        </h2>
        <div className="space-y-2">
          {bundles.map(b => <BundleCard key={b.id} b={b}/>)}
        </div>

        {/* Form */}
        <h2 className="font-bold text-[#8b0057] flex items-center gap-2 mt-6 mb-1 text-base" id="order-form">
          📝 Your Details <span className="flex-1 h-0.5 bg-pink-100"></span>
        </h2>
        <OrderForm />

        {/* Track link */}
        <div className="py-6 text-center">
          <Link href="/track" className="text-[#e91e8c] text-sm font-semibold hover:underline">
            Already ordered? Track your parcel →
          </Link>
        </div>
      </div>
    </div>
  );
}
