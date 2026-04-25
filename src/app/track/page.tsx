"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, Package, CheckCircle, Truck, RotateCcw, Clock, AlertCircle } from "lucide-react";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";

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

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  async function handleTrack() {
    if (!query.trim()) { setError("Please enter a tracking number or order reference."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch(`/api/postex/track?tracking=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Tracking information not found.");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not find tracking information.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <StoreNav />
      <CartDrawer />

      {/* Page header */}
      <div className="border-b border-[#EDE8E4] bg-white">
        <div className="max-w-lg mx-auto px-5 py-5 flex items-center gap-3">
          <Link href="/shop" className="text-[#6B6B6B] hover:text-[#9B2B47] transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-xl text-[#1A1A1A] leading-none">Track Your Order</h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Beauty Bee · PostEx Tracking</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-8 pb-16 space-y-4">

        {/* Search box */}
        <div className="bg-white rounded-3xl border border-[#EDE8E4] p-6">
          <h2 className="font-serif font-bold text-lg text-[#1A1A1A] mb-1">Enter your tracking number</h2>
          <p className="text-xs text-[#6B6B6B] mb-5 leading-relaxed">
            Your PostEx tracking number (starts with CX) or Beauty Bee order ref (starts with BB-)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTrack()}
              placeholder="e.g. CX-XXXXXXXXXXXX or BB-12345678"
              className="flex-1 border border-[#EDE8E4] rounded-2xl px-4 py-3 text-sm bg-[#FAF7F4] focus:outline-none focus:border-[#9B2B47] transition-colors placeholder:text-[#6B6B6B]/50"
            />
            <button
              onClick={handleTrack}
              disabled={loading}
              className="btn-ripple bg-[#9B2B47] hover:bg-[#7D1E35] text-white rounded-2xl px-5 py-3 font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Search size={15} />
              }
              Track
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-xs mt-3 flex items-center gap-1.5">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-3xl border border-[#EDE8E4] overflow-hidden">
            {/* Result header */}
            <div className="bg-[#9B2B47] p-5 text-white">
              <p className="text-xs text-white/60 mb-1 tracking-wide uppercase">Tracking Number</p>
              <p className="font-mono font-bold text-lg">{result.tracking}</p>
              <p className="text-xs text-white/60 mt-1">Ref: {result.orderRefNumber}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAF7F4] rounded-2xl p-3 border border-[#EDE8E4]">
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wide mb-1">Customer</p>
                  <p className="font-semibold text-[#1A1A1A] text-sm">{result.customerName}</p>
                </div>
                <div className="bg-[#FAF7F4] rounded-2xl p-3 border border-[#EDE8E4]">
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wide mb-1">City</p>
                  <p className="font-semibold text-[#1A1A1A] text-sm">{result.cityName}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                {STATUS_ICONS[result.history?.[result.history.length - 1]?.code] ?? <Package size={18} className="text-[#6B6B6B]" />}
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wide">Current Status</p>
                  <p className="font-semibold text-green-700 text-sm">{result.latestStatus}</p>
                </div>
              </div>

              <div className="bg-[#FAF7F4] border border-[#EDE8E4] rounded-2xl p-4">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wide mb-1">Amount (Cash on Delivery)</p>
                <p className="font-serif font-bold text-[#9B2B47] text-2xl">Rs. {result.invoicePayment.toLocaleString()}</p>
              </div>

              {result.history?.length > 0 && (
                <div>
                  <h3 className="font-serif font-bold text-[#1A1A1A] mb-4">Order Journey</h3>
                  <div className="space-y-3">
                    {[...result.history].reverse().map((h, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex flex-col items-center pt-0.5">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-[#9B2B47]" : "bg-[#EDE8E4]"}`} />
                          {i < result.history.length - 1 && (
                            <div className="w-px h-6 bg-[#EDE8E4] mt-1" />
                          )}
                        </div>
                        <p className={`text-sm pb-1 ${i === 0 ? "font-semibold text-[#1A1A1A]" : "text-[#6B6B6B]"}`}>
                          {h.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="bg-white rounded-3xl border border-[#EDE8E4] p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F9ECF0] rounded-2xl mb-4">
              <Package size={24} className="text-[#9B2B47]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A1A] mb-2">Need help with your order?</h3>
            <p className="text-sm text-[#6B6B6B] mb-6 leading-relaxed max-w-xs mx-auto">
              Enter your PostEx tracking number above. You can find it in your WhatsApp order confirmation.
            </p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
            >
              💬 Contact Beauty Bee
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
