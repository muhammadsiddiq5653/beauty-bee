"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft, CheckCircle, Leaf, Minus, Package,
  Plus, ShoppingBag, Star, Truck
} from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import FrequentlyBoughtTogether from "@/components/FrequentlyBoughtTogether";
import MediaGallery from "@/components/MediaGallery";
import StoreNav from "@/components/StoreNav";
import UrgencyBadge from "@/components/UrgencyBadge";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";

const ReviewsSection = dynamic(() => import("@/components/ReviewsSection"), {
  ssr: false,
  loading: () => <div className="h-40 rounded-2xl bg-white border border-[#EDE8E4]" />,
});
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  product: Product;
  suggestions: Product[];
  deliveryCharge: number;
}

export default function ProductDetailClient({ product, suggestions, deliveryCharge }: Props) {
  const [selectedShade, setSelectedShade] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();

  function handleAddToCart() {
    if (product.needsShade && !selectedShade) {
      alert("Please choose a shade first.");
      return;
    }
    addItem(product, qty, selectedShade || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const savings = product.oldPrice ? product.oldPrice - product.price : 0;
  const savingsPct = product.oldPrice ? Math.round((savings / product.oldPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <StoreNav />
      <CartDrawer initialDelivery={deliveryCharge} />
      <WhatsAppButton />

      <div className="max-w-2xl mx-auto px-5 py-5 pb-24">
        <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mb-5">
          <Link href="/" className="hover:text-[#9B2B47] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#9B2B47] transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-medium">{product.name}</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#EDE8E4] overflow-hidden">
          <div className="relative">
            <MediaGallery
              media={product.media ?? []}
              fallbackImageUrl={product.imageUrl}
              fallbackEmoji={product.emoji}
              alt={product.name}
              shades={product.shades}
              selectedShade={selectedShade}
            />
            {savingsPct > 0 && (
              <span className="absolute top-4 left-4 bg-[#9B2B47] text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                -{savingsPct}% OFF
              </span>
            )}
            {product.badge && (
              <span className="absolute top-4 right-4 bg-white text-[#9B2B47] text-xs font-semibold px-3 py-1 rounded-full border border-[#EDE8E4] shadow-sm z-10">
                {product.badge}
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div>
              <h1 className="font-serif font-bold text-2xl text-[#1A1A1A] leading-tight">{product.name}</h1>
              {product.subtitle && <p className="text-sm text-[#6B6B6B] mt-1">{product.subtitle}</p>}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="font-serif font-bold text-3xl text-[#9B2B47]">Rs. {product.price.toLocaleString()}</span>
                {product.oldPrice && <span className="text-base text-[#6B6B6B] line-through">Rs. {product.oldPrice.toLocaleString()}</span>}
                {savings > 0 && (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                    Save Rs. {savings.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map(score => <Star key={score} size={13} className="fill-[#C9A84C] text-[#C9A84C]" />)}
                <span className="text-xs text-[#6B6B6B] ml-1">2,500+ happy customers</span>
              </div>
            </div>

            <UrgencyBadge productId={product.id} stock={product.stock} />

            {product.description && (
              <p className="text-[#6B6B6B] text-sm leading-relaxed border-t border-[#EDE8E4] pt-5">
                {product.description}
              </p>
            )}

            {product.needsShade && product.shades.length > 0 && (
              <div className="border-t border-[#EDE8E4] pt-5">
                <p className="text-sm font-semibold text-[#1A1A1A] mb-3">
                  Choose Shade <span className="text-red-400">*</span>
                  {selectedShade && <span className="text-[#9B2B47] ml-2 font-medium">- {selectedShade}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.shades.map(shade => (
                    <button
                      key={shade.name}
                      onClick={() => setSelectedShade(shade.name)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        selectedShade === shade.name
                          ? "border-[#9B2B47] bg-[#F9ECF0] text-[#9B2B47]"
                          : "border-[#EDE8E4] text-[#6B6B6B] hover:border-[#9B2B47]/40"
                      }`}
                    >
                      {shade.hex && <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: shade.hex }} />}
                      {shade.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-[#EDE8E4] pt-5 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#FAF7F4] rounded-full px-3 py-2 border border-[#EDE8E4]">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-7 h-7 rounded-full border border-[#EDE8E4] text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white hover:border-[#9B2B47] transition-all">
                  <Minus size={11} />
                </button>
                <span className="font-bold text-[#1A1A1A] w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-7 h-7 rounded-full border border-[#EDE8E4] text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white hover:border-[#9B2B47] transition-all">
                  <Plus size={11} />
                </button>
              </div>
              <button onClick={handleAddToCart} className={`btn-ripple flex-1 py-3.5 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all ${added ? "bg-green-600 text-white" : "bg-[#9B2B47] hover:bg-[#7D1E35] text-white active:scale-95"}`}>
                {added ? <><CheckCircle size={17} /> Added to Cart</> : <><ShoppingBag size={17} /> Add to Cart - Rs. {(product.price * qty).toLocaleString()}</>}
              </button>
            </div>

            <div className="border-t border-[#EDE8E4] pt-5 grid grid-cols-3 gap-4">
              {[
                { icon: <Leaf size={15} />, title: "100% Organic", sub: "Natural ingredients" },
                { icon: <Truck size={15} />, title: "COD Delivery", sub: "Pay on arrival" },
                { icon: <Package size={15} />, title: "Pakistan-wide", sub: "via PostEx" },
              ].map(badge => (
                <div key={badge.title} className="text-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#F9ECF0] flex items-center justify-center mx-auto mb-2 text-[#9B2B47]">
                    {badge.icon}
                  </div>
                  <p className="text-xs font-semibold text-[#1A1A1A]">{badge.title}</p>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">{badge.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <FrequentlyBoughtTogether
          key={product.id}
          currentProductId={product.id}
          currentProduct={product}
          suggestedProducts={suggestions}
        />

        <div className="mt-10">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/60 mb-1">Social Proof</p>
            <h2 className="font-serif font-bold text-2xl text-[#1A1A1A]">What Customers Say</h2>
          </div>
          <ReviewsSection productId={product.id} />
        </div>

        <div className="mt-8 text-center">
          <Link href="/shop" className="inline-flex items-center gap-1 text-[#9B2B47] text-sm font-medium hover:underline underline-offset-2">
            <ChevronLeft size={15} /> Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

