"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check, CheckCircle, ChevronLeft, Gift,
  Shield, ShoppingBag, Sparkles, Truck
} from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import MediaGallery from "@/components/MediaGallery";
import StoreNav from "@/components/StoreNav";
import { useCartStore } from "@/store/cart";
import { trackPixel, PIXEL_CURRENCY } from "@/lib/fbpixel";
import type { Bundle } from "@/types";

const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  bundle: Bundle;
  deliveryCharge: number;
}

function Mesh() {
  return <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>;
}

export default function BundleDetailClient({ bundle, deliveryCharge }: Props) {
  const [added, setAdded] = useState(false);
  const { addBundle, items } = useCartStore();
  const inCart = items.some(item => item.productId === bundle.id && item.isBundle);

  useEffect(() => {
    trackPixel("ViewContent", {
      content_ids: [bundle.id],
      content_name: bundle.name,
      content_type: "product",
      value: bundle.price,
      currency: PIXEL_CURRENCY,
    });
  }, [bundle.id, bundle.name, bundle.price]);

  function handleAdd() {
    addBundle(bundle);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const savings = Math.max(0, bundle.oldPrice - bundle.price);
  const savingsPct = bundle.oldPrice ? Math.round((savings / bundle.oldPrice) * 100) : 0;
  const includesList = bundle.includes
    ? bundle.includes.split(/[,+&-]/).map(item => item.trim()).filter(Boolean)
    : [];

  return (
    <div className="bb-page pb-28">
      <Mesh />
      <StoreNav />
      <CartDrawer initialDelivery={deliveryCharge} />
      <WhatsAppButton />

      <main className="bb-shell px-5 pt-5">
        <Link href="/shop" className="mb-5 inline-flex items-center gap-1 text-sm font-black text-[var(--bb-ink-soft)] hover:text-[var(--bb-berry)]">
          <ChevronLeft size={16} /> Back to shop
        </Link>

        <section className="grid gap-5">
          <div className="overflow-hidden rounded-[26px]">
            {bundle.imageUrl || bundle.media?.length ? (
              <MediaGallery
                media={bundle.media ?? []}
                fallbackImageUrl={bundle.imageUrl}
                fallbackEmoji={bundle.emoji}
                alt={bundle.name}
              />
            ) : (
              <div className="bb-shotcard grid aspect-[4/3] place-items-center text-8xl">{bundle.emoji}</div>
            )}
          </div>

          <div className="bb-glass rounded-[26px] p-6">
            <span className="bb-eyebrow">Bundle Deal</span>
            <h1 className="bb-serif mt-2 text-5xl leading-[0.95] text-[var(--bb-ink)]">{bundle.name}</h1>
            <p className="mt-4 text-base font-bold leading-relaxed text-[var(--bb-ink-soft)]">{bundle.includes}</p>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <strong className="bb-serif text-4xl leading-none text-[var(--bb-berry)]">Rs. {bundle.price.toLocaleString()}</strong>
              {bundle.oldPrice ? <s className="text-base font-bold text-[var(--bb-ink-soft)]">Rs. {bundle.oldPrice.toLocaleString()}</s> : null}
              {savingsPct > 0 ? <span className="rounded-full bg-[var(--bb-berry)] px-3 py-1 text-xs font-black text-white">-{savingsPct}%</span> : null}
            </div>

            {savings > 0 ? (
              <div className="mt-4 rounded-2xl bg-white/60 p-4 text-sm font-black text-[var(--bb-ink)]">
                You save Rs. {savings.toLocaleString()} with this edit.
              </div>
            ) : null}

            {includesList.length > 0 ? (
              <div className="mt-6 border-t border-[rgba(155,43,71,0.08)] pt-5">
                <h2 className="bb-serif text-2xl text-[var(--bb-ink)]">What&apos;s included</h2>
                <ul className="mt-3 grid gap-2">
                  {includesList.map(item => (
                    <li key={item} className="flex items-center gap-2 rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold text-[var(--bb-ink-soft)]">
                      <CheckCircle size={16} className="text-green-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[rgba(155,43,71,0.08)] pt-5">
              {[
                { icon: <Truck size={16} />, title: "COD", sub: "Pay on arrival" },
                { icon: <Sparkles size={16} />, title: "Organic", sub: "Beauty ritual" },
                { icon: <Shield size={16} />, title: "Tracked", sub: "via PostEx" },
              ].map(badge => (
                <div key={badge.title} className="rounded-2xl bg-white/55 p-3 text-center">
                  <span className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-[rgba(155,43,71,0.08)] text-[var(--bb-berry)]">{badge.icon}</span>
                  <p className="text-[11px] font-black">{badge.title}</p>
                  <p className="text-[10px] font-semibold text-[var(--bb-ink-soft)]">{badge.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <div className="bb-sticky bb-glass">
        <div className="bb-sticky-row">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-[rgba(155,43,71,0.09)] text-[var(--bb-berry)]">
            {bundle.imageUrl ? <Image src={bundle.imageUrl} alt="" width={44} height={44} className="h-full w-full rounded-full object-cover" /> : <Gift size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="bb-serif block truncate text-xl leading-none">{bundle.name}</strong>
            <span className="text-sm font-black text-[var(--bb-berry)]">Rs. {bundle.price.toLocaleString()}</span>
          </div>
          <button className={`bb-btn bb-btn-primary px-4 ${added || inCart ? "bg-green-600" : ""}`} onClick={handleAdd}>
            {added || inCart ? <><Check size={17} /> Added</> : <><ShoppingBag size={17} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}
