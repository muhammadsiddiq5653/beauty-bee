"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ShoppingBag, CheckCircle, Zap } from "lucide-react";
import { getProducts } from "@/lib/firestore";
import { DEFAULT_PRODUCTS } from "@/lib/catalogue";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";

// Suggest companion products based on current product
function getSuggestions(currentId: string, allProducts: Product[]): Product[] {
  const pairings: Record<string, string[]> = {
    tint:  ["serum", "soap"],
    serum: ["mask", "soap"],
    mask:  ["serum", "tint"],
    soap:  ["tint", "serum"],
  };
  const ids = pairings[currentId] ?? allProducts.filter(p => p.id !== currentId).map(p => p.id).slice(0, 2);
  return ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[];
}

interface Props {
  currentProductId: string;
  currentProduct: Product;
}

export default function FrequentlyBoughtTogether({ currentProductId, currentProduct }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bundleAdded, setBundleAdded] = useState(false);
  const { addItem, items } = useCartStore();

  useEffect(() => {
    async function load() {
      try {
        const all = await getProducts();
        const active = all.filter(p => p.active !== false && p.id !== currentProductId);
        setProducts(getSuggestions(currentProductId, active.length > 0 ? active : (DEFAULT_PRODUCTS.map((p, idx) => ({ ...p, id: ["tint", "mask", "serum", "soap"][idx] })) as Product[])));
      } catch {
        const fallback = DEFAULT_PRODUCTS.map((p, idx) => ({ ...p, id: ["tint", "mask", "serum", "soap"][idx] })) as Product[];
        setProducts(getSuggestions(currentProductId, fallback.filter(p => p.id !== currentProductId)));
      }
    }
    load();
  }, [currentProductId]);

  const allItems = [currentProduct, ...products.filter(p => selected.has(p.id))];
  const bundleTotal = allItems.reduce((s, p) => s + p.price, 0);
  const originalTotal = allItems.reduce((s, p) => s + (p.oldPrice ?? p.price), 0);
  const bundleSavings = originalTotal - bundleTotal;

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addAllToCart() {
    allItems.forEach(p => addItem(p, 1));
    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 2000);
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-3xl shadow-sm border border-pink-50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100 flex items-center gap-2">
        <Zap size={18} className="text-[#e91e8c] animate-sparkle" />
        <h3 className="font-black text-[#8b0057]">Frequently Bought Together</h3>
      </div>

      <div className="p-4">
        {/* Product chain */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {/* Current product — always included */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center text-3xl shadow-sm ring-2 ring-[#e91e8c] ring-offset-2">
              {currentProduct.emoji}
            </div>
            <span className="text-[9px] font-bold text-[#8b0057] text-center leading-tight w-16 truncate">{currentProduct.name}</span>
            <span className="text-[10px] font-black text-[#e91e8c]">Rs. {currentProduct.price.toLocaleString()}</span>
          </div>

          {products.map((p, i) => {
            const isSelected = selected.has(p.id);
            const inCart = items.some(ci => ci.productId === p.id);
            return (
              <div key={p.id} className="flex items-center gap-2 flex-shrink-0">
                <Plus size={16} className="text-pink-300 flex-shrink-0" />
                <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => toggleSelect(p.id)}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all duration-200 relative ${isSelected ? "bg-gradient-to-br from-pink-100 to-pink-200 ring-2 ring-[#e91e8c] ring-offset-2 scale-105" : "bg-gray-50 ring-2 ring-gray-200 opacity-60"}`}>
                    {p.emoji}
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${isSelected ? "bg-[#e91e8c] text-white shadow" : "bg-gray-200 text-gray-400"}`}>
                      {isSelected ? "✓" : "+"}
                    </div>
                    {inCart && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle size={10} className="text-white" /></div>}
                  </div>
                  <span className="text-[9px] font-bold text-[#8b0057] text-center leading-tight w-16 truncate">{p.name}</span>
                  <span className={`text-[10px] font-black ${isSelected ? "text-[#e91e8c]" : "text-gray-400"}`}>Rs. {p.price.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Price summary */}
        <div className="bg-pink-50 rounded-xl p-3 mb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{allItems.length} items total:</span>
              <span className="font-black text-[#e91e8c]">Rs. {bundleTotal.toLocaleString()}</span>
              {bundleSavings > 0 && <span className="text-xs text-gray-400 line-through">Rs. {originalTotal.toLocaleString()}</span>}
            </div>
            {bundleSavings > 0 && (
              <p className="text-[11px] text-green-600 font-semibold mt-0.5">
                🎉 You save Rs. {bundleSavings.toLocaleString()} on this combo!
              </p>
            )}
          </div>
        </div>

        {/* Add all CTA */}
        <button
          onClick={addAllToCart}
          disabled={allItems.length <= 1}
          className={`btn-ripple w-full py-3 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow ${
            bundleAdded
              ? "bg-green-500 text-white scale-105"
              : allItems.length <= 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white hover:opacity-90 hover:scale-105 active:scale-95"
          }`}
        >
          {bundleAdded
            ? <><CheckCircle size={16} /> All Added to Cart!</>
            : <><ShoppingBag size={16} /> Add {allItems.length} Items to Cart — Rs. {bundleTotal.toLocaleString()}</>
          }
        </button>

        <p className="text-center text-[10px] text-gray-400 mt-2">
          Tap the + items above to include or exclude them
        </p>
      </div>

      {/* Related products row */}
      <div className="border-t border-pink-50 px-4 py-4">
        <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">You May Also Like</h4>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {products.map(p => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                {p.emoji}
              </div>
              <span className="text-[10px] font-semibold text-[#8b0057] text-center leading-tight w-14 line-clamp-2">{p.name}</span>
              <span className="text-[10px] font-black text-[#e91e8c]">Rs. {p.price.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
