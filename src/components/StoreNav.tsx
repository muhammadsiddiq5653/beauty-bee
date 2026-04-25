"use client";

import Link from "next/link";
import { ShoppingBag, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function StoreNav() {
  const { itemCount, openDrawer } = useCartStore();
  const count = itemCount();

  return (
    <header className="bg-white border-b border-[#EDE8E4] sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl">🐝</span>
          <div>
            <div className="font-serif font-bold text-[#9B2B47] text-base leading-none tracking-wide">BEAUTY BEE</div>
            <div className="text-[9px] text-[#6B6B6B] leading-none tracking-widest uppercase mt-0.5">Organic Beauty</div>
          </div>
        </Link>

        {/* Right actions */}
        <nav className="flex items-center gap-5">
          <Link href="/about" className="hidden sm:block text-xs text-[#6B6B6B] hover:text-[#9B2B47] transition-colors font-medium tracking-wide">
            About
          </Link>
          <Link href="/faq" className="hidden sm:block text-xs text-[#6B6B6B] hover:text-[#9B2B47] transition-colors font-medium tracking-wide">
            FAQ
          </Link>
          <Link href="/track" className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#9B2B47] transition-colors font-medium tracking-wide">
            <Package size={14} />
            Track
          </Link>
          <button
            onClick={openDrawer}
            className="btn-ripple relative flex items-center gap-2 bg-[#9B2B47] hover:bg-[#7D1E35] transition-colors text-white px-4 py-2 rounded-full text-xs font-semibold"
          >
            <ShoppingBag size={14} />
            Cart
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#C9A84C] text-white text-[9px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center shadow-sm">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
