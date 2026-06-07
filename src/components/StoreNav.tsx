"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function StoreNav() {
  const { itemCount, openDrawer } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const count = itemCount();

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <header className="bb-nav">
      <div className="bb-nav-inner bb-glass">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Beauty Bee" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/about" className="hidden text-xs font-black tracking-wide text-[var(--bb-ink-soft)] transition-colors hover:text-[var(--bb-berry)] sm:block">
            About
          </Link>
          <Link href="/faq" className="hidden text-xs font-black tracking-wide text-[var(--bb-ink-soft)] transition-colors hover:text-[var(--bb-berry)] sm:block">
            FAQ
          </Link>
          <Link href="/track" className="flex items-center gap-1.5 text-xs font-black tracking-wide text-[var(--bb-ink-soft)] transition-colors hover:text-[var(--bb-berry)]">
            <Package size={14} />
            Track
          </Link>
          <button
            onClick={openDrawer}
            className="bb-nav-cart"
            aria-label="Open cart"
          >
            <ShoppingBag size={14} />
            {mounted && count > 0 && (
              <span className="bb-cart-badge">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
