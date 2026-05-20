"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft, CheckCircle, Package,
  Shield, ShoppingBag, Truck
} from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import MediaGallery from "@/components/MediaGallery";
import StoreNav from "@/components/StoreNav";
import { useCartStore } from "@/store/cart";
import type { Bundle } from "@/types";

const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  bundle: Bundle;
  deliveryCharge: number;
}

export default function BundleDetailClient({ bundle, deliveryCharge }: Props) {
  const [added, setAdded] = useState(false);
  const { addBundle, items } = useCartStore();
  const inCart = items.some(item => item.productId === bundle.id && item.isBundle);

  function handleAdd() {
    addBundle(bundle);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const savings = bundle.oldPrice - bundle.price;
  const savingsPct = bundle.oldPrice ? Math.round((savings / bundle.oldPrice) * 100) : 0;
  const includesList = bundle.includes
    ? bundle.includes.split(/[,+&]/).map(item => item.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      <StoreNav />
      <CartDrawer initialDelivery={deliveryCharge} />

      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#e91e8c] mb-4 font-medium">
          <ChevronLeft size={16} /> Back to Shop
        </Link>

        <div className="rounded-3xl overflow-hidden shadow-sm border border-[#EDE8E4] mb-6">
          <MediaGallery
            media={bundle.media ?? []}
            fallbackImageUrl={bundle.imageUrl}
            fallbackEmoji={bundle.emoji}
            alt={bundle.name}
          />
        </div>

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
            {bundle.oldPrice > 0 && <span className="text-base text-gray-400 line-through">Rs. {bundle.oldPrice.toLocaleString()}</span>}
            {savings > 0 && <span className="text-sm font-bold text-green-600">Save Rs. {savings.toLocaleString()}</span>}
          </div>
        </div>

        {includesList.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE8E4] p-4 mb-4">
            <h2 className="text-sm font-black text-[#8b0057] mb-3">What&apos;s Included</h2>
            <ul className="space-y-2">
              {includesList.map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

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
                : <><ShoppingBag size={20} /> Add to Cart - Rs. {bundle.price.toLocaleString()}</>
              }
            </button>
          </div>
        </div>
      </div>

      <WhatsAppButton />
    </div>
  );
}
