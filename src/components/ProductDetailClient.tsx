"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check, ChevronLeft, Minus, Plus,
  Shield, ShoppingBag, Sparkles, Star, Truck
} from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import FrequentlyBoughtTogether from "@/components/FrequentlyBoughtTogether";
import MediaGallery from "@/components/MediaGallery";
import StoreNav from "@/components/StoreNav";
import UrgencyBadge from "@/components/UrgencyBadge";
import { useCartStore } from "@/store/cart";
import { trackPixel, PIXEL_CURRENCY } from "@/lib/fbpixel";
import type { Product, Shade } from "@/types";

const ReviewsSection = dynamic(() => import("@/components/ReviewsSection"), {
  ssr: false,
  loading: () => <div className="h-40 rounded-[22px] bg-white/50" />,
});
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  product: Product;
  suggestions: Product[];
  deliveryCharge: number;
}

const LOCAL_SHADE_IMAGES = [
  "/beauty-bee/tint-redberry.jpeg",
  "/beauty-bee/tint-pinkrose.jpeg",
  "/beauty-bee/tint-peachy.jpeg",
];

type ShadeView = Shade & { img: string; id: string; vibe: string };

function shadeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildShades(product: Product): ShadeView[] {
  return product.shades.map((shade, index) => ({
    ...shade,
    id: shadeSlug(shade.name),
    hex: shade.hex ?? ["#A52647", "#D26B86", "#EA8A63"][index % 3],
    img: LOCAL_SHADE_IMAGES[index % LOCAL_SHADE_IMAGES.length] ?? shade.imageUrl ?? product.imageUrl ?? "",
    vibe: ["Bold", "Soft", "Fresh", "Glow"][index % 4],
  }));
}

function Mesh() {
  return <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>;
}

function ShadeGallery({ product, shades, selected }: { product: Product; shades: ShadeView[]; selected: string }) {
  const active = Math.max(0, shades.findIndex(shade => shade.name === selected));

  if (shades.length === 0) {
    return (
      <div className="overflow-hidden rounded-[26px]">
        <MediaGallery media={product.media ?? []} fallbackImageUrl={product.imageUrl} fallbackEmoji={product.emoji} alt={product.name} />
      </div>
    );
  }

  return (
    <div className="bb-shotcard">
      <div className="bb-shot">
        {shades.map((shade, index) => (
          <Image
            key={shade.id}
            src={shade.img}
            alt={index === active ? `${product.name} in ${shade.name}` : ""}
            fill
            priority={index === active}
            sizes="(max-width: 720px) 100vw, 560px"
            className={index === active ? "is-on" : ""}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProductDetailClient({ product, suggestions, deliveryCharge }: Props) {
  const shades = useMemo(() => buildShades(product), [product]);
  const [selectedShade, setSelectedShade] = useState(shades[0]?.name ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const activeShade = shades.find(shade => shade.name === selectedShade) ?? shades[0];

  useEffect(() => {
    trackPixel("ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: PIXEL_CURRENCY,
    });
  }, [product.id, product.name, product.price]);

  function handleAddToCart() {
    if (product.needsShade && !selectedShade) {
      alert("Please choose a shade first.");
      return;
    }
    addItem(product, qty, selectedShade || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const savings = product.oldPrice ? product.oldPrice - product.price : 0;
  const savingsPct = product.oldPrice ? Math.round((savings / product.oldPrice) * 100) : 0;

  return (
    <div className="bb-page pb-28" style={activeShade ? { "--bb-shade": activeShade.hex, "--bb-shade-glow": `${activeShade.hex}70` } as React.CSSProperties : undefined}>
      <Mesh />
      <StoreNav />
      <CartDrawer initialDelivery={deliveryCharge} />
      <WhatsAppButton />

      <main className="bb-shell px-5 pt-5">
        <Link href="/shop" className="mb-5 inline-flex items-center gap-1 text-sm font-black text-[var(--bb-ink-soft)] hover:text-[var(--bb-berry)]">
          <ChevronLeft size={16} /> Back to shop
        </Link>

        <section className="grid gap-5">
          <ShadeGallery product={product} shades={shades} selected={selectedShade} />

          <div className="bb-glass rounded-[26px] p-6">
            <span className="bb-eyebrow">{product.badge || "Beauty Bee"}</span>
            <h1 className="bb-serif mt-2 text-5xl leading-[0.95] text-[var(--bb-ink)]">{product.name}</h1>
            {product.subtitle ? <p className="mt-3 text-base font-bold text-[var(--bb-ink-soft)]">{product.subtitle}</p> : null}

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <strong className="bb-serif text-4xl leading-none text-[var(--bb-berry)]">Rs. {product.price.toLocaleString()}</strong>
              {product.oldPrice ? <s className="text-base font-bold text-[var(--bb-ink-soft)]">Rs. {product.oldPrice.toLocaleString()}</s> : null}
              {savingsPct > 0 ? <span className="rounded-full bg-[var(--bb-berry)] px-3 py-1 text-xs font-black text-white">-{savingsPct}%</span> : null}
            </div>

            <div className="mt-4 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(score => <Star key={score} size={15} className="fill-[#f5a623] text-[#f5a623]" />)}
              <span className="text-xs font-bold text-[var(--bb-ink-soft)]">2,500+ happy customers</span>
            </div>

            <div className="mt-5">
              <UrgencyBadge productId={product.id} stock={product.stock} />
            </div>

            {product.description ? (
              <p className="mt-5 border-t border-[rgba(155,43,71,0.08)] pt-5 text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">
                {product.description}
              </p>
            ) : null}

            {product.needsShade && shades.length > 0 ? (
              <div className="mt-6 border-t border-[rgba(155,43,71,0.08)] pt-5">
                <p className="text-sm font-black text-[var(--bb-ink)]">
                  Choose Shade {selectedShade ? <span className="text-[var(--bb-berry)]">- {selectedShade}</span> : null}
                </p>
                <div className="bb-swatches mt-4">
                  {shades.map(shade => (
                    <button
                      key={shade.id}
                      className={`bb-swatch ${selectedShade === shade.name ? "is-active" : ""}`}
                      onClick={() => setSelectedShade(shade.name)}
                      style={{ "--c": shade.hex } as React.CSSProperties}
                    >
                      <span className="bb-swatch-dot" />
                      <span className="flex-1">
                        <span className="bb-swatch-name">{shade.name}</span>
                        <span className="bb-swatch-vibe">{shade.vibe}</span>
                      </span>
                      {selectedShade === shade.name ? <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: shade.hex }}><Check size={14} /></span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[rgba(155,43,71,0.08)] pt-5">
              {[
                { icon: <Sparkles size={16} />, title: "Organic", sub: "Natural feel" },
                { icon: <Truck size={16} />, title: "COD", sub: "Pay later" },
                { icon: <Shield size={16} />, title: "PostEx", sub: "Tracked" },
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

        <FrequentlyBoughtTogether
          key={product.id}
          currentProductId={product.id}
          currentProduct={product}
          suggestedProducts={suggestions}
        />

        <section className="bb-section px-0" id="reviews">
          <div className="bb-section-head">
            <span className="bb-eyebrow">Social Proof</span>
            <h2 className="bb-section-title">What customers<br /><em>say.</em></h2>
          </div>
          <ReviewsSection productId={product.id} />
        </section>
      </main>

      <div className="bb-sticky bb-glass">
        <div className="bb-sticky-row">
          <span className="bb-sticky-dot" style={{ background: activeShade?.hex ?? "var(--bb-berry)" }} />
          <div className="min-w-0 flex-1">
            <strong className="bb-serif block truncate text-xl leading-none">{selectedShade || product.name}</strong>
            <span className="text-sm font-black text-[var(--bb-berry)]">Rs. {(product.price * qty).toLocaleString()}</span>
          </div>
          <div className="flex items-center rounded-full bg-white/60 p-1">
            <button className="grid h-8 w-8 place-items-center rounded-full" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={13} /></button>
            <span className="w-7 text-center text-sm font-black">{qty}</span>
            <button className="grid h-8 w-8 place-items-center rounded-full" onClick={() => setQty(qty + 1)}><Plus size={13} /></button>
          </div>
          <button className={`bb-btn bb-btn-primary px-4 ${added ? "bg-green-600" : ""}`} onClick={handleAddToCart}>
            {added ? <><Check size={17} /> Added</> : <><ShoppingBag size={17} /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}
