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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE8E4] bg-white text-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#9B2B47]" />
            <span className="font-serif font-bold text-lg text-[#1A1A1A]">Your Cart</span>
            {itemCount() > 0 && (
              <span className="bg-[#F9ECF0] text-[#9B2B47] text-xs font-semibold px-2 py-0.5 rounded-full">
                {itemCount()} {itemCount() === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button onClick={closeDrawer} className="p-1.5 rounded-full hover:bg-[#FAF7F4] text-[#6B6B6B] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Package size={48} className="text-[#EDE8E4] mb-4" />
              <p className="font-serif font-bold text-[#1A1A1A] text-lg mb-1">Your cart is empty</p>
              <p className="text-sm text-[#6B6B6B] mb-6">Add some products to get started</p>
              <button onClick={closeDrawer}
                className="bg-[#9B2B47] hover:bg-[#7D1E35] text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-colors">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.key} className="flex items-center gap-3 bg-[#FAF7F4] rounded-2xl p-3">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-white border border-[#EDE8E4] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="object-cover w-full h-full rounded-xl" />
                  ) : (
                    <span className="text-2xl">{item.emoji ?? "🛍️"}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A1A1A] text-sm leading-tight truncate">{item.name}</p>
                  {item.isBundle && <span className="text-[10px] bg-[#F9ECF0] text-[#9B2B47] border border-[#9B2B47]/20 px-1.5 py-0.5 rounded-full font-semibold">Bundle</span>}
                  <p className="text-xs text-[#6B6B6B] mt-0.5">Rs. {item.unitPrice.toLocaleString()} each</p>
                  <p className="font-bold text-[#9B2B47] text-sm">Rs. {(item.qty * item.unitPrice).toLocaleString()}</p>
                </div>

                {/* Qty controls */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.key, item.qty - 1)}
                      className="w-6 h-6 rounded-full border border-[#EDE8E4] text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white hover:border-[#9B2B47] transition-colors">
                      <Minus size={10} />
                    </button>
                    <span className="w-6 text-center font-bold text-[#1A1A1A] text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.key, item.qty + 1)}
                      className="w-6 h-6 rounded-full border border-[#EDE8E4] text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white hover:border-[#9B2B47] transition-colors">
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
          <div className="border-t border-[#EDE8E4] px-4 py-4 space-y-3 bg-white">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-[#6B6B6B]">
                <span>Subtotal</span>
                <span>Rs. {subtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-[#6B6B6B]">
                <span>Delivery (PostEx COD)</span>
                <span>Rs. {DELIVERY}</span>
              </div>
              <div className="flex justify-between font-bold text-[#9B2B47] text-base border-t border-[#EDE8E4] pt-1.5">
                <span>Total (COD)</span>
                <span>Rs. {total().toLocaleString()}</span>
              </div>
            </div>

            <Link href="/checkout" onClick={closeDrawer}
              className="btn-ripple w-full bg-[#9B2B47] hover:bg-[#7D1E35] text-white rounded-full py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md">
              Place Order <ArrowRight size={16} />
            </Link>
            <button onClick={closeDrawer}
              className="w-full text-center text-sm text-[#6B6B6B] hover:text-[#9B2B47] py-1 font-medium transition-colors">
              ← Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
