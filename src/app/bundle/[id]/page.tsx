"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ShoppingBag, CheckCircle, RefreshCw,
  Truck, Shield, Package, Gift
} from "lucide-react";
import { getBundles } from "@/lib/firestore";
import { useCartStore } from "@/store/cart";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Bundle } from "@/types";

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addBundle, items } = useCartStore();
  const inCart = items.some(i => i.productId === id && i.isBundle);

  useEffect(() => {
    getBundles()
      .then(all => setBundle(all.find(b => b.id === id && b.active !== false) ?? null))
      .catch(() => setBundle(null))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd() {
    if (!bundle) return;
    addBundle(bundle);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const savings = bundle ? bundle.oldPrice - bundle.price : 0;
  const savingsPct = bundle?.oldPrice ? Math.round((savings / bundle.oldPrice) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <RefreshCw size={28} className="animate-spin text-[#e91e8c]" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center gap-4 p-6">
        <Gift size={48} className="text-gray-300" />
        <p className="text-gray-500 font-semibold">Bundle not found</p>
        <Link href="/shop" className="text-[#e91e8c] font-bold text-sm underline">Back to Shop</Link>
      </div>
    );
  }

  const includesList = bundle.includes
    ? bundle.includes.split(/[,+&]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      <StoreNav />
      <CartDrawer />

      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* Back */}
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#e91e8c] mb-4 font-medium">
          <ChevronLeft size={16} /> Back to Shop
        </Link>

        {/* Image / Emoji hero */}
        <div className="w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center mb-6 shadow-sm border border-[#EDE8E4]">
          {bundle.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bundle.imageUrl} alt={bundle.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">{bundle.emoji}</span>
          )}
        </div>

        {/* Title & price */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full">Bundle Deal</span>
            {savingsPct > 0 && (
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
                -{savingsPct}% OFF
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A] leading-tight mb-2">{bundle.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#9B2B47]">Rs. {bundle.price.toLocaleString()}</span>
            {bundle.oldPrice > 0 && (
              <span className="text-base text-gray-400 line-through">Rs. {bundle.oldPrice.toLocaleString()}</span>
            )}
            {savings > 0 && (
              <span className="text-sm font-bold text-green-600">Save Rs. {savings.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* What's included */}
        {includesList.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE8E4] p-4 mb-4">
            <h2 className="text-sm font-black text-[#8b0057] mb-3">What&apos;s Included</h2>
            <ul className="space-y-2">
              {includesList.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <Truck size={18} />, label: "COD Delivery", sub: "Pay on arrival" },
            { icon: <Shield size={18} />, label: "100% Organic", sub: "Natural ingredients" },
            { icon: <Package size={18} />, label: "Pakistan-wide", sub: "via PostEx" },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#EDE8E4] p-3 flex flex-col items-center text-center gap-1">
              <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center text-[#e91e8c]">{icon}</div>
              <span className="text-[11px] font-bold text-gray-700">{label}</span>
              <span className="text-[10px] text-gray-400">{sub}</span>
            </div>
          ))}
        </div>

        {/* Add to cart */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg z-40">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleAdd}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                added || inCart
                  ? "bg-green-500 text-white scale-[0.98]"
                  : "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white hover:opacity-90 active:scale-95"
              }`}
            >
              {added || inCart
                ? <><CheckCircle size={20} /> Added to Cart</>
                : <><ShoppingBag size={20} /> Add to Cart — Rs. {bundle.price.toLocaleString()}</>
              }
            </button>
          </div>
        </div>
      </div>

      <WhatsAppButton />
    </div>
  );
}
