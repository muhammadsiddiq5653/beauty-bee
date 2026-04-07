"use client";

import { useState } from "react";
import { Tag, X, CheckCircle, Loader2 } from "lucide-react";

interface PromoResult {
  code: string;
  label: string;
  discount: number;
  type: "percent" | "fixed";
  value: number;
}

interface Props {
  subtotal: number;
  onApply: (promo: PromoResult | null) => void;
  applied: PromoResult | null;
}

export default function PromoCodeField({ subtotal, onApply, applied }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        onApply(data);
        setInput("");
      } else {
        setError(data.error ?? "Invalid code.");
      }
    } catch {
      setError("Could not validate code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function remove() {
    onApply(null);
    setInput("");
    setError("");
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 animate-slide-up">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-700">
              <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded text-xs mr-1">{applied.code}</span>
              applied!
            </p>
            <p className="text-xs text-green-600">{applied.label} — saving Rs. {applied.discount.toLocaleString()}</p>
          </div>
        </div>
        <button onClick={remove} className="text-gray-400 hover:text-red-500 transition-colors p-1">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={e => e.key === "Enter" && apply()}
            placeholder="Enter promo code"
            className="w-full pl-8 pr-3 py-2.5 border-2 border-pink-100 rounded-xl text-sm bg-pink-50 focus:outline-none focus:border-[#e91e8c] font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal transition-colors"
          />
        </div>
        <button
          onClick={apply}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
          Apply
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <X size={11} /> {error}
        </p>
      )}
    </div>
  );
}
