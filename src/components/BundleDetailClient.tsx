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
import type { Bundle, Shade } from "@/types";

const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  bundle: Bundle;
  deliveryCharge: number;
  shadeOptions?: Shade[];
  shadeSlotCount?: number;
}

function Mesh() {
  return <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>;
}

const SLOT_LABELS = ["First Tint", "Second Tint", "Third Tint", "Fourth Tint"];

export default function BundleDetailClient({ bundle, deliveryCharge, shadeOptions = [], shadeSlotCount = 0 }: Props) {
  const [added, setAdded] = useState(false);
  const [selectedShades, setSelectedShades] = useState<string[]>([]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [poppedShade, setPoppedShade] = useState<string | null>(null);
  const { addBundle, items } = useCartStore();
  const hasShades = shadeSlotCount > 0 && shadeOptions.length > 0;
  const shadesComplete = !hasShades || selectedShades.filter(Boolean).length === shadeSlotCount;
  const shadeLabel = selectedShades.filter(Boolean).join(" + ") || undefined;
  const cartKey = `bundle_${bundle.id}` + (shadeLabel ? `_${shadeLabel.replace(/\s+/g, "_")}` : "");
  const inCart = items.some(item => item.key === cartKey);

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
    if (hasShades && !shadesComplete) {
      alert(`Please select a shade for all ${shadeSlotCount} tints.`);
      return;
    }
    addBundle(bundle, shadeLabel);
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

            {hasShades ? (
              <div className="mt-6 border-t border-[rgba(155,43,71,0.08)] pt-5">
                <h2 className="bb-serif text-2xl text-[var(--bb-ink)]">Choose Your Shades</h2>
                <p className="mt-1 text-sm font-semibold text-[var(--bb-ink-soft)]">
                  {shadeSlotCount === 1 ? "Tap a shade below." : "One shade per tint — tap to pick."}
                </p>

                {/* Slot indicators (duo / trio only) */}
                {shadeSlotCount > 1 && (
                  <div className="mt-5 flex items-center gap-5">
                    {Array.from({ length: shadeSlotCount }, (_, i) => {
                      const sel = shadeOptions.find(s => s.name === selectedShades[i]);
                      const isActive = activeSlot === i;
                      return (
                        <button key={i} onClick={() => setActiveSlot(i)} className="flex flex-col items-center gap-1.5">
                          <div
                            className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300
                              ${sel ? "shadow-md" : "border-[2px] border-dashed border-[rgba(155,43,71,0.3)]"}
                              ${isActive ? "ring-[3px] ring-[var(--bb-berry)] ring-offset-2 scale-110" : ""}
                            `}
                            style={sel ? {
                              background: sel.hex ?? "#A52647",
                              boxShadow: `0 4px 14px ${sel.hex ?? "#A52647"}50`,
                            } : {}}
                          >
                            {sel
                              ? <Check size={18} strokeWidth={3} className="text-white drop-shadow-sm" />
                              : <span className="select-none text-xl font-black text-[var(--bb-berry)] opacity-25">?</span>
                            }
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isActive ? "text-[var(--bb-berry)]" : "text-[var(--bb-ink-soft)]"
                          }`}>
                            {SLOT_LABELS[i] ?? `Tint ${i + 1}`}
                          </span>
                        </button>
                      );
                    })}
                    {shadesComplete && (
                      <div className="ml-auto flex -space-x-1.5 animate-fade-in">
                        {selectedShades.map((name, i) => {
                          const s = shadeOptions.find(x => x.name === name);
                          return <div key={i} className="h-5 w-5 rounded-full border-[1.5px] border-white shadow-sm" style={{ background: s?.hex }} />;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Step label */}
                {shadeSlotCount > 1 && (
                  <div className="mt-4">
                    <span className="inline-block rounded-full bg-[rgba(155,43,71,0.08)] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[var(--bb-berry)]">
                      {shadesComplete ? "Combo ready ✓" : `Picking ${SLOT_LABELS[activeSlot] ?? `Tint ${activeSlot + 1}`}`}
                    </span>
                  </div>
                )}

                {/* Shade circles */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {shadeOptions.map((shade) => {
                    const slotForThis = selectedShades.findIndex(s => s === shade.name);
                    const effectiveSlot = shadeSlotCount === 1 ? 0 : activeSlot;
                    const isActive = selectedShades[effectiveSlot] === shade.name;
                    const isPopping = poppedShade === shade.name;
                    return (
                      <button
                        key={shade.name}
                        onClick={() => {
                          const updated = [...selectedShades];
                          updated[effectiveSlot] = shade.name;
                          setSelectedShades(updated);
                          setPoppedShade(shade.name);
                          setTimeout(() => setPoppedShade(null), 350);
                          if (shadeSlotCount > 1) {
                            const next = Array.from({ length: shadeSlotCount }, (_, i) => i)
                              .find(i => i !== effectiveSlot && !updated[i]);
                            if (next !== undefined) setTimeout(() => setActiveSlot(next), 120);
                          }
                        }}
                        className="group flex flex-col items-center gap-2"
                      >
                        <div
                          className={`relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-[4px] transition-all duration-200 active:scale-90
                            ${isPopping ? "animate-swatch-pop" : ""}
                            ${isActive
                              ? "border-[var(--bb-berry)] scale-[1.1]"
                              : "border-white hover:scale-[1.06]"
                            }
                          `}
                          style={{
                            background: shade.hex ?? "#A52647",
                            boxShadow: isActive
                              ? `0 6px 18px ${shade.hex ?? "#A52647"}55, inset 0 -2px 5px rgba(0,0,0,0.12)`
                              : "0 4px 12px rgba(0,0,0,0.13), inset 0 -2px 5px rgba(0,0,0,0.08)",
                          }}
                        >
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/[0.2]">
                              <Check size={24} strokeWidth={3} className="text-white" />
                            </div>
                          )}
                          {slotForThis >= 0 && !isActive && shadeSlotCount > 1 && (
                            <div className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--bb-berry)] shadow">
                              <span className="text-[9px] font-black text-white">{slotForThis + 1}</span>
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-black leading-tight text-center transition-colors ${
                          isActive ? "text-[var(--bb-berry)]" : "text-[var(--bb-ink-soft)]"
                        }`}>
                          {shade.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Combo preview */}
                {shadesComplete && shadeLabel ? (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[rgba(155,43,71,0.05)] px-4 py-3 animate-bounce-in">
                    <div className="flex -space-x-2">
                      {selectedShades.map((name, i) => {
                        const s = shadeOptions.find(x => x.name === name);
                        return (
                          <div key={i} className="h-7 w-7 rounded-full border-2 border-white shadow-sm" style={{ background: s?.hex ?? "#A52647" }} />
                        );
                      })}
                    </div>
                    <span className="text-sm font-black text-[var(--bb-ink)]">{shadeLabel}</span>
                    <Check size={15} className="ml-auto text-green-600" strokeWidth={2.5} />
                  </div>
                ) : null}
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
          <button
            className={`bb-btn bb-btn-primary px-4 ${added || inCart ? "bg-green-600" : ""} ${hasShades && !shadesComplete ? "opacity-60" : ""}`}
            onClick={handleAdd}
          >
            {added || inCart ? <><Check size={17} /> Added</> : <><ShoppingBag size={17} /> {hasShades && !shadesComplete ? "Pick shades" : "Add"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
