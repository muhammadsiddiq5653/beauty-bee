"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Package, Plus, Trash2, X } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function CartDrawer({
  initialDelivery,
  initialFreeDeliveryThreshold,
}: {
  initialDelivery?: number;
  initialFreeDeliveryThreshold?: number;
}) {
  const { items, drawerOpen, closeDrawer, removeItem, updateQty, subtotal, itemCount } = useCartStore();
  const [baseDelivery, setBaseDelivery] = useState(initialDelivery ?? parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200"));
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(initialFreeDeliveryThreshold ?? 0);
  const [mounted, setMounted] = useState(false);
  const drawerItems = mounted ? items : [];
  const drawerCount = mounted ? itemCount() : 0;
  const threshold = freeDeliveryThreshold > 0 ? freeDeliveryThreshold : 0;
  const sub = mounted ? subtotal() : 0;
  const delivery = freeDeliveryThreshold > 0 && sub >= freeDeliveryThreshold ? 0 : baseDelivery;
  const total = sub > 0 ? sub + delivery : 0;
  const remaining = threshold > 0 ? Math.max(0, threshold - sub) : 0;
  const pct = threshold > 0 ? Math.min(100, (sub / threshold) * 100) : 0;

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (initialDelivery !== undefined && initialFreeDeliveryThreshold !== undefined) return;
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (initialDelivery === undefined && s.deliveryCharge) setBaseDelivery(s.deliveryCharge);
      if (initialFreeDeliveryThreshold === undefined && s.freeDeliveryThreshold !== undefined) setFreeDeliveryThreshold(s.freeDeliveryThreshold);
    }).catch(() => {});
  }, [initialDelivery, initialFreeDeliveryThreshold]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDrawer]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (!drawerOpen && drawerItems.length === 0) return null;

  return (
    <div
      className={`bb-drawer-overlay ${drawerOpen ? "is-open" : ""}`}
      onClick={event => {
        if (event.target === event.currentTarget) closeDrawer();
      }}
    >
      <aside className={`bb-drawer ${drawerOpen ? "is-open" : ""}`} role="dialog" aria-label="Shopping cart">
        <div className="flex items-center justify-between border-b border-[rgba(155,43,71,0.08)] px-5 py-5">
          <h2 className="bb-serif flex items-center gap-2 text-2xl text-[var(--bb-ink)]">
            Your Cart
            {drawerCount > 0 ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[var(--bb-berry)] px-2 text-xs font-black text-white">{drawerCount}</span> : null}
          </h2>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-[rgba(155,43,71,0.07)] text-[var(--bb-ink)]" onClick={closeDrawer} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {drawerItems.length === 0 ? (
          <div className="grid flex-1 place-items-center px-8 text-center">
            <div>
              <Package className="mx-auto text-[var(--bb-berry)]" size={48} />
              <h3 className="bb-serif mt-4 text-3xl">Your cart is empty.</h3>
              <p className="mt-2 text-sm font-semibold text-[var(--bb-ink-soft)]">Add your tint shade and come back here.</p>
              <button className="bb-btn bb-btn-ghost mt-6" onClick={closeDrawer}>Continue shopping</button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4">
              {threshold > 0 ? (
                <>
                  <div className="bb-freebar-track"><div className="bb-freebar-fill" style={{ width: `${pct}%` }} /></div>
                  <span className="bb-freebar-label">
                    {remaining === 0 ? "Free delivery unlocked" : `Rs. ${remaining.toLocaleString()} away from free delivery`}
                  </span>
                </>
              ) : null}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {drawerItems.map(item => (
                <div key={item.key} className="flex items-center gap-3 rounded-2xl border border-[rgba(155,43,71,0.06)] bg-white/65 p-3">
                  <div className="grid h-14 w-14 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--bb-cream-deep)] text-2xl">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} width={56} height={56} className="h-full w-full object-cover" />
                    ) : (
                      item.emoji ?? <Package size={20} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[var(--bb-ink)]">{item.name}</p>
                    {item.shade ? <p className="text-xs font-semibold text-[var(--bb-ink-soft)]">{item.shade}</p> : null}
                    <p className="bb-serif text-lg font-bold text-[var(--bb-berry)]">Rs. {(item.qty * item.unitPrice).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-xl bg-[rgba(155,43,71,0.07)]">
                      <button className="grid h-8 w-8 place-items-center" onClick={() => updateQty(item.key, item.qty - 1)} aria-label={`Decrease ${item.name}`}>
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-sm font-black">{item.qty}</span>
                      <button className="grid h-8 w-8 place-items-center" onClick={() => updateQty(item.key, item.qty + 1)} aria-label={`Increase ${item.name}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button className="text-[var(--bb-ink-soft)] hover:text-red-600" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.name}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[rgba(155,43,71,0.08)] px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4">
              <div className="space-y-2 text-sm font-semibold text-[var(--bb-ink-soft)]">
                <div className="flex justify-between"><span>Subtotal</span><span>Rs. {sub.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{delivery === 0 ? "FREE" : `Rs. ${delivery.toLocaleString()}`}</span></div>
                <div className="flex justify-between border-t border-[rgba(155,43,71,0.08)] pt-3 text-[var(--bb-ink)]">
                  <span>Total</span>
                  <span className="bb-serif text-2xl text-[var(--bb-berry)]">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
              <Link href="/checkout" onClick={closeDrawer} className="bb-btn bb-btn-primary mt-4 w-full">
                Checkout - Rs. {total.toLocaleString()} <ArrowRight size={18} />
              </Link>
              <button className="mt-3 w-full py-2 text-sm font-black text-[var(--bb-ink-soft)]" onClick={closeDrawer}>Continue shopping</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
