"use client";

import Link from "next/link";
import { ShoppingBag, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function StoreNav() {
  const { itemCount, openDrawer } = useCartStore();
  const count = itemCount();

  return (
    <header className="bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐝</span>
          <div>
            <div className="font-black text-lg leading-none">BEAUTY BEE</div>
            <div className="text-[10px] opacity-70 leading-none">100% Organic Beauty</div>
          </div>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link href="/track" className="flex items-center gap-1 text-xs text-white/80 hover:text-white font-semibold">
            <Package size={15} /> Track
          </Link>
          <button onClick={openDrawer} className="relative flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-2 rounded-full font-bold text-sm">
            <ShoppingBag size={16} />
            Cart
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-white text-[#e91e8c] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
