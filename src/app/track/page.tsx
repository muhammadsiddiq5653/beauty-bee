"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search, Package, CheckCircle, Truck, RotateCcw, Clock, AlertCircle } from "lucide-react";

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
  "0001": <Package className="text-blue-500" size={20}/>,
  "0003": <Truck className="text-purple-500" size={20}/>,
  "0004": <Truck className="text-orange-500" size={20}/>,
  "0005": <CheckCircle className="text-green-500" size={20}/>,
  "0006": <RotateCcw className="text-red-400" size={20}/>,
  "0007": <RotateCcw className="text-red-400" size={20}/>,
  "0008": <AlertCircle className="text-yellow-500" size={20}/>,
  "0013": <Clock className="text-orange-400" size={20}/>,
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
    <div className="min-h-screen bg-[#fdf3f9]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-lg mx-auto px-3 py-4 flex items-center gap-3">
          <Link href="/order" className="text-white/80 hover:text-white"><ChevronLeft size={22}/></Link>
          <div>
            <div className="font-black">Track Your Order</div>
            <div className="text-xs opacity-80">🐝 Beauty Bee · PostEx Tracking</div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-3 pt-6 pb-16">

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
          <h2 className="font-bold text-[#8b0057] mb-1">Enter your tracking number</h2>
          <p className="text-xs text-gray-400 mb-4">Your PostEx tracking number (starts with CX) or Beauty Bee order ref (starts with BB-)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTrack()}
              placeholder="e.g. CX-XXXXXXXXXXXX or BB-12345678"
              className="flex-1 border-2 border-pink-100 rounded-xl px-3 py-2.5 text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c]"
            />
            <button onClick={handleTrack} disabled={loading}
              className="bg-[#e91e8c] text-white rounded-xl px-4 py-2.5 font-bold text-sm flex items-center gap-1.5 hover:bg-[#8b0057] transition-colors disabled:opacity-60">
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full"></span> : <Search size={16}/>}
              Track
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">⚠️ {error}</p>}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Status Header */}
            <div className="bg-gradient-to-r from-[#8b0057] to-[#e91e8c] p-4 text-white">
              <div className="text-xs opacity-80 mb-0.5">Tracking Number</div>
              <div className="font-mono font-bold text-lg">{result.tracking}</div>
              <div className="text-xs opacity-80 mt-1">Ref: {result.orderRefNumber}</div>
            </div>

            <div className="p-4 space-y-4">
              {/* Customer & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-pink-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Customer</p>
                  <p className="font-semibold text-[#8b0057] text-sm">{result.customerName}</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">City</p>
                  <p className="font-semibold text-[#8b0057] text-sm">{result.cityName}</p>
                </div>
              </div>

              {/* Latest Status */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <div>{STATUS_ICONS[result.history?.[result.history.length-1]?.code] ?? <Package size={20} className="text-gray-400"/>}</div>
                <div>
                  <p className="text-xs text-gray-500">Current Status</p>
                  <p className="font-bold text-green-700">{result.latestStatus}</p>
                </div>
              </div>

              {/* COD Amount */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-gray-500">Amount (Cash on Delivery)</p>
                <p className="font-black text-amber-700 text-lg">Rs. {result.invoicePayment.toLocaleString()}</p>
              </div>

              {/* History Timeline */}
              {result.history?.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#8b0057] text-sm mb-3">Order Journey</h3>
                  <div className="space-y-2">
                    {[...result.history].reverse().map((h, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full mt-0.5 ${i === 0 ? "bg-[#e91e8c]" : "bg-gray-300"}`}></div>
                          {i < result.history.length - 1 && <div className="w-0.5 h-6 bg-gray-200 mt-1"></div>}
                        </div>
                        <div className={`text-sm pb-1 ${i === 0 ? "font-semibold text-[#8b0057]" : "text-gray-500"}`}>
                          {h.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        {!result && !loading && (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="font-bold text-[#8b0057] mb-1">Need help with your order?</p>
            <p className="text-sm text-gray-500 mb-4">
              Enter your PostEx tracking number above. You can find it in your WhatsApp order confirmation.
            </p>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-green-600">
              💬 Contact Beauty Bee
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
