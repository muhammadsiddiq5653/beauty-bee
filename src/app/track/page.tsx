"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, ChevronLeft, Clock, Package, RotateCcw, Search, Truck } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import StoreNav from "@/components/StoreNav";

interface TrackResult {
  tracking: string;
  customerName: string;
  cityName: string;
  status: string;
  latestStatus: string;
  history: { message: string; code: string; readable: string }[];
  invoicePayment: number;
  orderRefNumber: string;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "0001": <Package className="text-blue-500" size={18} />,
  "0003": <Truck className="text-purple-500" size={18} />,
  "0004": <Truck className="text-orange-500" size={18} />,
  "0005": <CheckCircle className="text-green-500" size={18} />,
  "0006": <RotateCcw className="text-red-400" size={18} />,
  "0007": <RotateCcw className="text-red-400" size={18} />,
  "0008": <AlertCircle className="text-yellow-500" size={18} />,
  "0013": <Clock className="text-orange-400" size={18} />,
};

function Mesh() {
  return <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>;
}

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  async function handleTrack() {
    if (!query.trim()) {
      setError("Please enter a tracking number or order reference.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/postex/track?tracking=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Tracking information not found.");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not find tracking information.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bb-page">
      <Mesh />
      <StoreNav />
      <CartDrawer />

      <main className="bb-shell px-5 py-6 pb-16">
        <Link href="/shop" className="mb-6 inline-flex items-center gap-1 text-sm font-black text-[var(--bb-ink-soft)] hover:text-[var(--bb-berry)]">
          <ChevronLeft size={16} /> Back to shop
        </Link>

        <div className="bb-section-head">
          <span className="bb-eyebrow">PostEx Tracking</span>
          <h1 className="bb-section-title">Track your<br /><em>order.</em></h1>
          <p className="bb-section-sub">Use your PostEx tracking number or Beauty Bee reference.</p>
        </div>

        <section className="bb-glass rounded-[28px] p-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTrack()}
              placeholder="CX-XXXXXXXXXXXX or BB-12345678"
              className="bb-input flex-1"
            />
            <button onClick={handleTrack} disabled={loading} className="bb-btn bb-btn-primary px-5 disabled:opacity-60">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Search size={17} />}
            </button>
          </div>
          {error ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-500">
              <AlertCircle size={13} /> {error}
            </p>
          ) : null}
        </section>

        {result ? (
          <section className="bb-glass mt-5 overflow-hidden rounded-[28px]">
            <div className="bg-[var(--bb-berry)] p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/65">Tracking Number</p>
              <p className="mt-1 font-mono text-xl font-black">{result.tracking}</p>
              <p className="mt-1 text-xs font-semibold text-white/70">Ref: {result.orderRefNumber}</p>
            </div>

            <div className="grid gap-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bb-ink-soft)]">Customer</p>
                  <p className="mt-1 text-sm font-black">{result.customerName}</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bb-ink-soft)]">City</p>
                  <p className="mt-1 text-sm font-black">{result.cityName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
                {STATUS_ICONS[result.history?.[result.history.length - 1]?.code] ?? <Package size={18} className="text-[var(--bb-ink-soft)]" />}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bb-ink-soft)]">Current Status</p>
                  <p className="text-sm font-black text-green-700">{result.latestStatus}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--bb-ink-soft)]">Cash on Delivery</p>
                <p className="bb-serif mt-1 text-3xl text-[var(--bb-berry)]">Rs. {result.invoicePayment.toLocaleString()}</p>
              </div>

              {result.history?.length > 0 ? (
                <div>
                  <h2 className="bb-serif mb-4 text-2xl">Order journey</h2>
                  <div className="space-y-3">
                    {[...result.history].reverse().map((item, index) => (
                      <div key={`${item.code}-${index}`} className="flex items-start gap-3">
                        <div className="flex flex-col items-center pt-1">
                          <span className={`h-3 w-3 rounded-full ${index === 0 ? "bg-[var(--bb-berry)]" : "bg-[rgba(155,43,71,0.15)]"}`} />
                          {index < result.history.length - 1 ? <span className="mt-1 h-7 w-px bg-[rgba(155,43,71,0.12)]" /> : null}
                        </div>
                        <p className={`text-sm leading-relaxed ${index === 0 ? "font-black text-[var(--bb-ink)]" : "font-semibold text-[var(--bb-ink-soft)]"}`}>
                          {item.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : !loading ? (
          <section className="bb-glass mt-5 rounded-[28px] p-8 text-center">
            <Package className="mx-auto text-[var(--bb-berry)]" size={44} />
            <h2 className="bb-serif mt-4 text-3xl">Need help with your order?</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">
              Your tracking number is sent after checkout. You can also message us on WhatsApp for help.
            </p>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="bb-btn bb-btn-ghost mt-6">
              Contact Beauty Bee
            </a>
          </section>
        ) : null}
      </main>
    </div>
  );
}
