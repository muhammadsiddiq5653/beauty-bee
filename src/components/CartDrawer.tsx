"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";

const DELIVERY = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, removeItem, updateQty, subtotal, total, itemCount } = useCartStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDrawer]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (!drawerOpen && items.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={closeDrawer}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pink-100 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <span className="font-black text-lg">Your Cart</span>
            {itemCount() > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount()} {itemCount() === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button onClick={closeDrawer} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Package size={48} className="text-pink-200 mb-4" />
              <p className="font-bold text-gray-500 text-lg mb-1">Your cart is empty</p>
              <p className="text-sm text-gray-400 mb-6">Add some products to get started</p>
              <button onClick={closeDrawer}
                className="bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.key} className="flex items-center gap-3 bg-pink-50 rounded-2xl p-3">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-white border border-pink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="object-cover w-full h-full rounded-xl" />
                  ) : (
                    <span className="text-2xl">{item.emoji ?? "🛍️"}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#8b0057] text-sm leading-tight truncate">{item.name}</p>
                  {item.isBundle && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">Bundle</span>}
                  <p className="text-xs text-gray-500 mt-0.5">Rs. {item.unitPrice.toLocaleString()} each</p>
                  <p className="font-black text-[#e91e8c] text-sm">Rs. {(item.qty * item.unitPrice).toLocaleString()}</p>
                </div>

                {/* Qty controls */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.key, item.qty - 1)}
                      className="w-6 h-6 rounded-full border-2 border-[#e91e8c] text-[#e91e8c] flex items-center justify-center hover:bg-[#e91e8c] hover:text-white transition-colors">
                      <Minus size={10} />
                    </button>
                    <span className="w-6 text-center font-bold text-[#8b0057] text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.key, item.qty + 1)}
                      className="w-6 h-6 rounded-full border-2 border-[#e91e8c] text-[#e91e8c] flex items-center justify-center hover:bg-[#e91e8c] hover:text-white transition-colors">
                      <Plus size={10} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.key)}
                    className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-pink-100 px-4 py-4 space-y-3 bg-white">
            {/* Price breakdown */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>Rs. {subtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery (PostEx COD)</span>
                <span>Rs. {DELIVERY}</span>
              </div>
              <div className="flex justify-between font-black text-[#e91e8c] text-base border-t border-pink-100 pt-1.5">
                <span>Total (COD)</span>
                <span>Rs. {total().toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <Link href="/checkout" onClick={closeDrawer}
              className="w-full bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white rounded-full py-3.5 font-black text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg">
              Place Order <ArrowRight size={18} />
            </Link>
            <button onClick={closeDrawer}
              className="w-full text-center text-sm text-gray-400 hover:text-[#e91e8c] py-1 font-semibold">
              ← Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
