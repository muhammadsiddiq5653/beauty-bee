"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, Plus, Minus, ShoppingBag, Star,
  Shield, Truck, Package, CheckCircle, RefreshCw
} from "lucide-react";
import { getProducts } from "@/lib/firestore";
import { DEFAULT_PRODUCTS } from "@/lib/catalogue";
import { useCartStore } from "@/store/cart";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import FrequentlyBoughtTogether from "@/components/FrequentlyBoughtTogether";
import ReviewsSection from "@/components/ReviewsSection";
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
      } catch { /* fall through to defaults */ }
      // Fallback to catalogue defaults
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
      alert("Please choose a shade 💕");
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
      <div className="min-h-screen bg-[#fdf3f9]">
        <StoreNav />
        <CartDrawer />
        <div className="flex items-center justify-center py-24 gap-2 text-[#e91e8c]">
          <RefreshCw size={22} className="animate-spin" />
          <span className="text-sm font-semibold">Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fdf3f9]">
        <StoreNav />
        <CartDrawer />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-xl font-black text-[#8b0057] mb-2">Product not found</h1>
          <Link href="/shop" className="text-[#e91e8c] font-semibold hover:underline">← Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf3f9]">
      <StoreNav />
      <CartDrawer />

      <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:text-[#e91e8c]">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#e91e8c]">Shop</Link>
          <span>/</span>
          <span className="text-[#8b0057] font-semibold">{product.name}</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Product Image / Hero */}
          <div className="relative bg-gradient-to-br from-pink-50 to-pink-100 h-64 flex items-center justify-center">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="text-center">
                <div className="text-8xl mb-2">{product.emoji}</div>
                <div className="text-xs text-pink-300 font-semibold">100% Organic</div>
              </div>
            )}
            {product.badge && (
              <span className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full shadow ${product.badgeColor === "green" ? "bg-green-500 text-white" : "bg-[#e91e8c] text-white"}`}>
                {product.badge}
              </span>
            )}
            {savingsPct > 0 && (
              <span className="absolute top-4 left-4 bg-amber-400 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                -{savingsPct}% OFF
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* Name & Price */}
            <div>
              <h1 className="text-2xl font-black text-[#8b0057] leading-tight">{product.name}</h1>
              {product.subtitle && <p className="text-sm text-gray-400 mt-0.5">{product.subtitle}</p>}
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-black text-[#e91e8c]">Rs. {product.price.toLocaleString()}</span>
                {product.oldPrice && (
                  <span className="text-lg text-gray-300 line-through">Rs. {product.oldPrice.toLocaleString()}</span>
                )}
                {savings > 0 && (
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                    Save Rs. {savings.toLocaleString()}
                  </span>
                )}
              </div>
              {/* Stars (decorative) */}
              <div className="flex items-center gap-1 mt-1.5">
                {[1,2,3,4,5].map(s => <Star key={s} size={13} className="fill-amber-400 text-amber-400" />)}
                <span className="text-xs text-gray-400 ml-1">500+ happy customers</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed border-t border-pink-50 pt-4">
                {product.description}
              </p>
            )}

            {/* Shade selector */}
            {product.needsShade && product.shades.length > 0 && (
              <div className="border-t border-pink-50 pt-4">
                <p className="text-sm font-bold text-[#8b0057] mb-2.5">
                  Choose Shade <span className="text-red-400">*</span>
                  {selectedShade && <span className="text-[#e91e8c] font-semibold ml-2">— {selectedShade}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.shades.map(s => (
                    <button key={s.name} onClick={() => setSelectedShade(s.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 text-sm font-semibold transition-all ${selectedShade === s.name ? "border-[#e91e8c] bg-pink-50 text-[#8b0057]" : "border-gray-200 text-gray-600 hover:border-pink-200"}`}>
                      {s.hex && <span className="w-4 h-4 rounded-full border border-white shadow-sm flex-shrink-0" style={{ backgroundColor: s.hex }} />}
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="border-t border-pink-50 pt-4 flex items-center gap-3">
              {/* Qty */}
              <div className="flex items-center gap-2 bg-pink-50 rounded-full px-3 py-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-7 h-7 rounded-full border-2 border-[#e91e8c] text-[#e91e8c] flex items-center justify-center hover:bg-[#e91e8c] hover:text-white transition-colors">
                  <Minus size={12} />
                </button>
                <span className="font-black text-[#8b0057] w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-7 h-7 rounded-full border-2 border-[#e91e8c] text-[#e91e8c] flex items-center justify-center hover:bg-[#e91e8c] hover:text-white transition-colors">
                  <Plus size={12} />
                </button>
              </div>

              {/* Add to Cart */}
              <button onClick={handleAddToCart}
                className={`flex-1 py-3.5 rounded-full font-black text-base flex items-center justify-center gap-2 transition-all shadow-md ${added ? "bg-green-500 text-white" : "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white hover:opacity-90 active:scale-95"}`}>
                {added ? (
                  <><CheckCircle size={18} /> Added to Cart!</>
                ) : (
                  <><ShoppingBag size={18} /> Add to Cart — Rs. {(product.price * qty).toLocaleString()}</>
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="border-t border-pink-50 pt-4 grid grid-cols-3 gap-3">
              {[
                { icon: <Shield size={16} />, title: "100% Organic", sub: "Natural ingredients" },
                { icon: <Truck size={16} />, title: "COD Delivery", sub: "Pay on arrival" },
                { icon: <Package size={16} />, title: "Pakistan-wide", sub: "via PostEx" },
              ].map(b => (
                <div key={b.title} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-1.5 text-[#e91e8c]">
                    {b.icon}
                  </div>
                  <p className="text-xs font-bold text-[#8b0057]">{b.title}</p>
                  <p className="text-[10px] text-gray-400">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Frequently Bought Together — keyed so it remounts on product change */}
        <FrequentlyBoughtTogether
          key={product.id}
          currentProductId={product.id}
          currentProduct={product}
        />

        {/* Reviews */}
        <ReviewsSection productId={product.id} />

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href="/shop" className="inline-flex items-center gap-1 text-[#e91e8c] text-sm font-semibold hover:underline">
            <ChevronLeft size={16} /> Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
