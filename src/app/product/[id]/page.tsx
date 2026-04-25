"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, Plus, Minus, ShoppingBag, Star,
  Shield, Truck, Package, CheckCircle, RefreshCw, Leaf
} from "lucide-react";
import { getProducts } from "@/lib/firestore";
import { DEFAULT_PRODUCTS } from "@/lib/catalogue";
import { useCartStore } from "@/store/cart";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import FrequentlyBoughtTogether from "@/components/FrequentlyBoughtTogether";
import ReviewsSection from "@/components/ReviewsSection";
import UrgencyBadge from "@/components/UrgencyBadge";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShade, setSelectedShade] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    async function load() {
      try {
        const prods = await getProducts();
        const found = prods.find(p => p.id === id && p.active !== false);
        if (found) { setProduct(found); return; }
      } catch { /* fall through */ }
      const fallback = DEFAULT_PRODUCTS.map((p, i) => ({
        ...p, id: ["tint", "mask", "serum", "soap"][i]
      })) as Product[];
      setProduct(fallback.find(p => p.id === id) ?? null);
    }
    load().finally(() => setLoading(false));
  }, [id]);

  function handleAddToCart() {
    if (!product) return;
    if (product.needsShade && !selectedShade) {
      alert("Please choose a shade first.");
      return;
    }
    addItem(product, qty, selectedShade || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const savings = product?.oldPrice ? product.oldPrice - product.price : 0;
  const savingsPct = product?.oldPrice ? Math.round((savings / product.oldPrice) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F4]">
        <StoreNav /><CartDrawer />
        <div className="flex items-center justify-center py-24 gap-2 text-[#9B2B47]">
          <RefreshCw size={20} className="animate-spin" />
          <span className="text-sm font-medium text-[#6B6B6B]">Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF7F4]">
        <StoreNav /><CartDrawer />
        <div className="max-w-lg mx-auto px-5 py-20 text-center">
          <Package size={48} className="text-[#EDE8E4] mx-auto mb-4" />
          <h1 className="font-serif font-bold text-xl text-[#1A1A1A] mb-2">Product not found</h1>
          <Link href="/shop" className="text-[#9B2B47] font-medium hover:underline text-sm">← Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4]">
      <StoreNav />
      <CartDrawer />
      <WhatsAppButton />

      <div className="max-w-2xl mx-auto px-5 py-5 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mb-5">
          <Link href="/" className="hover:text-[#9B2B47] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#9B2B47] transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-medium">{product.name}</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#EDE8E4] overflow-hidden">
          {/* Product image */}
          <div className="relative bg-[#F2EDE8] h-72 flex items-center justify-center">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
            ) : (
              <span className="text-9xl">{product.emoji}</span>
            )}
            {savingsPct > 0 && (
              <span className="absolute top-4 left-4 bg-[#9B2B47] text-white text-xs font-semibold px-3 py-1 rounded-full">
                −{savingsPct}% OFF
              </span>
            )}
            {product.badge && (
              <span className="absolute top-4 right-4 bg-white text-[#9B2B47] text-xs font-semibold px-3 py-1 rounded-full border border-[#EDE8E4] shadow-sm">
                {product.badge}
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">
            {/* Name & price */}
            <div>
              <h1 className="font-serif font-bold text-2xl text-[#1A1A1A] leading-tight">{product.name}</h1>
              {product.subtitle && <p className="text-sm text-[#6B6B6B] mt-1">{product.subtitle}</p>}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="font-serif font-bold text-3xl text-[#9B2B47]">Rs. {product.price.toLocaleString()}</span>
                {product.oldPrice && (
                  <span className="text-base text-[#6B6B6B] line-through">Rs. {product.oldPrice.toLocaleString()}</span>
                )}
                {savings > 0 && (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                    Save Rs. {savings.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {[1,2,3,4,5].map(s => <Star key={s} size={13} className="fill-[#C9A84C] text-[#C9A84C]" />)}
                <span className="text-xs text-[#6B6B6B] ml-1">2,500+ happy customers</span>
              </div>
            </div>

            <UrgencyBadge productId={product.id} stock={product.stock} />

            {product.description && (
              <p className="text-[#6B6B6B] text-sm leading-relaxed border-t border-[#EDE8E4] pt-5">
                {product.description}
              </p>
            )}

            {/* Shade selector */}
            {product.needsShade && product.shades.length > 0 && (
              <div className="border-t border-[#EDE8E4] pt-5">
                <p className="text-sm font-semibold text-[#1A1A1A] mb-3">
                  Choose Shade <span className="text-red-400">*</span>
                  {selectedShade && <span className="text-[#9B2B47] ml-2 font-medium">— {selectedShade}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.shades.map(s => (
                    <button key={s.name} onClick={() => setSelectedShade(s.name)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        selectedShade === s.name
                          ? "border-[#9B2B47] bg-[#F9ECF0] text-[#9B2B47]"
                          : "border-[#EDE8E4] text-[#6B6B6B] hover:border-[#9B2B47]/40"
                      }`}>
                      {s.hex && <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: s.hex }} />}
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + CTA */}
            <div className="border-t border-[#EDE8E4] pt-5 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#FAF7F4] rounded-full px-3 py-2 border border-[#EDE8E4]">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-7 h-7 rounded-full border border-[#EDE8E4] text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white hover:border-[#9B2B47] transition-all">
                  <Minus size={11} />
                </button>
                <span className="font-bold text-[#1A1A1A] w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-7 h-7 rounded-full border border-[#EDE8E4] text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white hover:border-[#9B2B47] transition-all">
                  <Plus size={11} />
                </button>
              </div>
              <button onClick={handleAddToCart}
                className={`btn-ripple flex-1 py-3.5 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all ${
                  added
                    ? "bg-green-600 text-white"
                    : "bg-[#9B2B47] hover:bg-[#7D1E35] text-white active:scale-95"
                }`}>
                {added
                  ? <><CheckCircle size={17} /> Added to Cart</>
                  : <><ShoppingBag size={17} /> Add to Cart — Rs. {(product.price * qty).toLocaleString()}</>
                }
              </button>
            </div>

            {/* Trust badges */}
            <div className="border-t border-[#EDE8E4] pt-5 grid grid-cols-3 gap-4">
              {[
                { icon: <Leaf size={15} />, title: "100% Organic", sub: "Natural ingredients" },
                { icon: <Truck size={15} />, title: "COD Delivery", sub: "Pay on arrival" },
                { icon: <Package size={15} />, title: "Pakistan-wide", sub: "via PostEx" },
              ].map(b => (
                <div key={b.title} className="text-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#F9ECF0] flex items-center justify-center mx-auto mb-2 text-[#9B2B47]">
                    {b.icon}
                  </div>
                  <p className="text-xs font-semibold text-[#1A1A1A]">{b.title}</p>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Frequently Bought Together */}
        <FrequentlyBoughtTogether key={product.id} currentProductId={product.id} currentProduct={product} />

        {/* Reviews */}
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
