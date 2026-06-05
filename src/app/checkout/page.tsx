"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Check, ChevronLeft, CreditCard,
  Package, RefreshCw, Shield, ShoppingBag, Truck, X
} from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import PromoCodeField from "@/components/PromoCodeField";
import StoreNav from "@/components/StoreNav";
import { trackEvent } from "@/lib/analytics";
import { trackPixel, PIXEL_CURRENCY } from "@/lib/fbpixel";
import { useCartStore } from "@/store/cart";

const DELIVERY_DEFAULT = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");

const FALLBACK_CITIES = [
  "Abbottabad","Attock","Badin","Bahawalpur","Bannu","Chakwal",
  "Dera Ghazi Khan","Faisalabad","Gujranwala","Gujrat","Hyderabad",
  "Islamabad","Karachi","Lahore","Mardan","Multan","Peshawar",
  "Quetta","Rawalpindi","Sahiwal","Sargodha","Sialkot","Sukkur",
].sort();

type SuccessData = {
  refNumber: string;
  trackingNumber: string | null;
  total: number;
};

interface PromoResult {
  code: string;
  label: string;
  discount: number;
  type: "percent" | "fixed";
  value: number;
}

function Mesh() {
  return <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>;
}

export default function CheckoutPage() {
  const { items, subtotal, itemCount, clearCart } = useCartStore();
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [baseDelivery, setBaseDelivery] = useState(DELIVERY_DEFAULT);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
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

  const sub = subtotal();
  const discount = promo?.discount ?? 0;
  const delivery = freeDeliveryThreshold > 0 && sub >= freeDeliveryThreshold ? 0 : baseDelivery;
  const finalTotal = Math.max(0, sub + delivery - discount);

  useEffect(() => {
    trackEvent("checkout_view", { items: itemCount(), subtotal: subtotal() });
    trackPixel("InitiateCheckout", {
      content_ids: items.map(i => i.productId),
      content_type: "product",
      num_items: itemCount(),
      value: subtotal(),
      currency: PIXEL_CURRENCY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (s.deliveryCharge) setBaseDelivery(s.deliveryCharge);
      if (s.freeDeliveryThreshold) setFreeDeliveryThreshold(s.freeDeliveryThreshold);
    }).catch(() => {});
  }, []);

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
    if (err) {
      setError(err);
      trackEvent("checkout_validation_error", { message: err, step });
      return;
    }
    setError("");
    setLoading(true);
    const orderItems = items.map(i => ({ productId: i.productId, isBundle: i.isBundle, key: i.key, name: i.name, qty: i.qty, shade: i.shade }));
    try {
      const startedAt = performance.now();
      trackEvent("checkout_submit", { items: itemCount(), total: finalTotal });
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: orderItems, promoCode: promo?.code }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccess({
        refNumber: data.refNumber,
        trackingNumber: data.trackingNumber,
        total: data.total,
      });
      trackEvent("checkout_success", {
        orderId: data.orderId,
        trackingCreated: Boolean(data.trackingNumber),
        durationMs: Math.round(performance.now() - startedAt),
        total: data.total,
      });
      trackPixel("Purchase", {
        content_ids: items.map(i => i.productId),
        content_type: "product",
        num_items: itemCount(),
        value: data.total,
        currency: PIXEL_CURRENCY,
      });
      clearCart();
    } catch (e: unknown) {
      trackEvent("checkout_error", {
        message: e instanceof Error ? e.message : "Unknown error",
        total: finalTotal,
      });
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bb-page">
        <Mesh />
        <StoreNav />
        <CartDrawer />
        <main className="bb-shell px-5 py-10">
          <div className="bb-glass rounded-[28px] p-8 text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-500 text-white">
              <Check size={42} />
            </span>
            <h1 className="bb-serif mt-6 text-5xl leading-none">Order Confirmed!</h1>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">
              Your order is confirmed. A confirmation email with your order details has been sent to you.
            </p>
            <div className="mt-7 grid gap-3">
              <div className="rounded-2xl bg-white/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bb-ink-soft)]">Order Reference</p>
                <p className="bb-serif text-2xl text-[var(--bb-berry)]">{success.refNumber}</p>
              </div>
              {success.trackingNumber ? (
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bb-ink-soft)]">PostEx Tracking</p>
                  <p className="font-black text-blue-700">{success.trackingNumber}</p>
                </div>
              ) : null}
              <div className="rounded-2xl bg-white/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bb-ink-soft)]">Amount to pay on delivery</p>
                <p className="bb-serif text-3xl text-[var(--bb-berry)]">Rs. {success.total.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/track" className="bb-btn bb-btn-primary mt-7 w-full">
              Track My Order <ArrowRight size={18} />
            </Link>
            <Link href="/shop" className="bb-btn bb-btn-ghost mt-3 w-full">Continue shopping</Link>
          </div>
        </main>
      </div>
    );
  }

  if (itemCount() === 0) {
    return (
      <div className="bb-page">
        <Mesh />
        <StoreNav />
        <CartDrawer />
        <main className="bb-shell grid min-h-[70svh] place-items-center px-5 text-center">
          <div className="bb-glass rounded-[28px] p-8">
            <ShoppingBag className="mx-auto text-[var(--bb-berry)]" size={48} />
            <h1 className="bb-serif mt-5 text-4xl">Your cart is empty</h1>
            <p className="mt-2 text-sm font-semibold text-[var(--bb-ink-soft)]">Add your favorite Beauty Bee products before checkout.</p>
            <Link href="/shop" className="bb-btn bb-btn-primary mt-6">Shop now</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bb-page">
      <Mesh />
      <StoreNav />
      <CartDrawer />

      <main className="bb-shell px-5 py-6 pb-16">
        <Link href="/shop" className="mb-5 inline-flex items-center gap-1 text-sm font-black text-[var(--bb-ink-soft)] hover:text-[var(--bb-berry)]">
          <ChevronLeft size={16} /> Back to shop
        </Link>

        <div className="bb-section-head mb-5">
          <span className="bb-eyebrow">Cash on Delivery</span>
          <h1 className="bb-section-title">Beauty Bee<br /><em>checkout.</em></h1>
        </div>

        <div className="mb-5 flex items-center justify-center gap-0">
          {[1, 2].map(n => (
            <button
              key={n}
              onClick={() => setStep(n as 1 | 2)}
              className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black ${step >= n ? "bg-[var(--bb-berry)] text-white" : "bg-white/60 text-[var(--bb-ink-soft)]"}`}
            >
              {n}
            </button>
          ))}
        </div>

        {step === 1 ? (
          <div className="grid gap-4">
            <section className="bb-glass rounded-[26px] p-5">
              <h2 className="bb-serif text-2xl">Your order ({itemCount()} items)</h2>
              <div className="mt-4 grid gap-3">
                {items.map(item => (
                  <div key={item.key} className="flex items-center gap-3 rounded-2xl bg-white/60 p-3">
                    <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-[var(--bb-cream-deep)] text-2xl">
                      {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="h-full w-full object-cover" /> : item.emoji ?? <Package size={18} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">{item.name}</strong>
                      <span className="text-xs font-semibold text-[var(--bb-ink-soft)]">Qty {item.qty} x Rs. {item.unitPrice.toLocaleString()}</span>
                    </span>
                    <strong className="bb-serif text-lg text-[var(--bb-berry)]">Rs. {(item.qty * item.unitPrice).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2 border-t border-[rgba(155,43,71,0.08)] pt-4 text-sm font-semibold text-[var(--bb-ink-soft)]">
                <div className="flex justify-between"><span>Subtotal</span><span>Rs. {sub.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{delivery === 0 ? "FREE" : `Rs. ${delivery.toLocaleString()}`}</span></div>
                {discount > 0 ? <div className="flex justify-between text-green-600"><span>Promo ({promo?.code})</span><span>-Rs. {discount.toLocaleString()}</span></div> : null}
                <div className="flex justify-between border-t border-[rgba(155,43,71,0.08)] pt-3 text-[var(--bb-ink)]">
                  <span>Total COD</span>
                  <span className="bb-serif text-2xl text-[var(--bb-berry)]">Rs. {finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </section>

            <section className="bb-glass rounded-[26px] p-5">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--bb-ink-soft)]">Have a promo code?</p>
              <PromoCodeField subtotal={sub} items={items} onApply={setPromo} applied={promo} />
            </section>

            <section className="bb-glass rounded-[22px] p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 text-[var(--bb-berry)]" size={18} />
                <div>
                  <p className="font-black">Cash on Delivery</p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--bb-ink-soft)]">Pay Rs. {finalTotal.toLocaleString()} when your order arrives. No prepayment needed.</p>
                </div>
              </div>
            </section>

            <button onClick={() => setStep(2)} className="bb-btn bb-btn-primary w-full">
              Continue to details <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <section className="bb-glass rounded-[26px] p-5">
              <h2 className="bb-serif text-2xl">Delivery details</h2>
              {error ? (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  <X size={15} /> {error}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4">
                <div className="bb-form-field">
                  <label>Full Name *</label>
                  <input className="bb-input" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="e.g. Fatima Ahmed" />
                </div>
                <div className="bb-form-field">
                  <label>Phone Number *</label>
                  <input className="bb-input" type="tel" maxLength={11} value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} placeholder="03XXXXXXXXX" />
                </div>
                <div className="bb-form-field">
                  <label>Email Address *</label>
                  <input className="bb-input" type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} placeholder="fatima@gmail.com" />
                </div>
                <div className="bb-form-field">
                  <label>Delivery Address *</label>
                  <textarea className="bb-input min-h-24 resize-none" value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="House No., street, area, landmark..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bb-form-field">
                    <label>City *</label>
                    <select className="bb-input" value={form.cityName} onChange={e => setForm({ ...form, cityName: e.target.value })}>
                      <option value="">Select city</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  <div className="bb-form-field">
                    <label>Payment</label>
                    <div className="bb-input text-[var(--bb-ink-soft)]">COD</div>
                  </div>
                </div>
                <div className="bb-form-field">
                  <label>Special Instructions</label>
                  <input className="bb-input" value={form.transactionNotes} onChange={e => setForm({ ...form, transactionNotes: e.target.value })} placeholder="Call before delivery" />
                </div>
              </div>
            </section>

            <section className="bb-glass rounded-[22px] p-4">
              <div className="flex items-center gap-3">
                <Shield className="text-[var(--bb-berry)]" size={18} />
                <div className="flex-1">
                  <p className="text-sm font-black">PostEx tracked delivery</p>
                  <p className="text-xs font-semibold text-[var(--bb-ink-soft)]">Confirmation email sent after purchase.</p>
                </div>
                <Truck className="text-[var(--bb-berry)]" size={18} />
              </div>
            </section>

            <button onClick={placeOrder} disabled={loading} className="bb-btn bb-btn-primary w-full disabled:opacity-60">
              {loading ? <><RefreshCw className="animate-spin" size={18} /> Placing order...</> : <>Place order - Rs. {finalTotal.toLocaleString()}</>}
            </button>
            <button onClick={() => setStep(1)} className="py-2 text-sm font-black text-[var(--bb-ink-soft)]">Edit order</button>
          </div>
        )}
      </main>
    </div>
  );
}
