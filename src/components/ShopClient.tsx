"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, CheckCircle, Leaf, Minus, Package, Plus,
  Shield, ShoppingBag, Star, Truck
} from "lucide-react";
import StoreNav from "@/components/StoreNav";
import UrgencyBadge from "@/components/UrgencyBadge";
import { useCartStore } from "@/store/cart";
import type { Bundle, Product } from "@/types";
import type { MarketingBanner, StoreSettings } from "@/lib/firestore";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"), {
  ssr: false,
  loading: () => null,
});
const ReviewsSection = dynamic(() => import("@/components/ReviewsSection"), {
  ssr: false,
  loading: () => <div className="h-40 rounded-2xl bg-white border border-[#EDE8E4]" />,
});
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
  loading: () => null,
});
const EmailCapture = dynamic(() => import("@/components/EmailCapture"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  products: Product[];
  bundles: Bundle[];
  settings: StoreSettings;
}

function sectionType(section: MarketingBanner): NonNullable<MarketingBanner["type"]> {
  if (section.type) return section.type;
  if (section.placement === "top") return "announcement";
  if (section.placement === "hero") return "hero";
  return "promo";
}

function orderedSections(banners: MarketingBanner[] | undefined) {
  return (banners ?? [])
    .filter(section => section.active && section.title.trim())
    .map((section, index) => ({ ...section, sortOrder: section.sortOrder ?? index * 10 }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function AnnouncementTicker({ banners }: { banners: MarketingBanner[] }) {
  const text = banners.map(banner => banner.title).join("   ·   ");
  if (!text) return null;

  return (
    <div className="bg-[#9B2B47] text-white/90 text-[11px] font-medium py-2 overflow-hidden tracking-wide">
      <div className="flex whitespace-nowrap animate-ticker">
        <span className="px-6">{text}</span>
        <span className="px-6">{text}</span>
      </div>
    </div>
  );
}

function HeroBanner({ banner }: { banner: MarketingBanner }) {
  const href = banner.href || "#products";
  const hasMedia = Boolean(banner.videoUrl || banner.imageUrl);

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: banner.backgroundColor || "#F2EDE8", color: banner.textColor || "#1A1A1A" }}
    >
      {banner.videoUrl ? (
        <video
          src={banner.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
      ) : banner.imageUrl ? (
        <Image
          src={banner.imageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25"
        />
      ) : null}
      {hasMedia && <div className="absolute inset-0 bg-[#FAF7F4]/30" />}
      <div className="relative max-w-5xl mx-auto px-5 py-16 md:py-24 flex flex-col items-center text-center">
        {banner.eyebrow && (
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/70 mb-4">
            {banner.eyebrow}
          </p>
        )}
        <h1 className="font-serif font-bold text-5xl md:text-6xl leading-[1.1] mb-4">
          {banner.title}
          {banner.highlight && (
            <>
              <br />
              <span className="text-[#9B2B47]">{banner.highlight}</span>
            </>
          )}
        </h1>
        {banner.body && (
          <p className="text-[#6B6B6B] text-base max-w-sm mx-auto mb-8 leading-relaxed">{banner.body}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={href} className="btn-ripple inline-flex items-center gap-2 bg-[#9B2B47] hover:bg-[#7D1E35] text-white font-semibold px-8 py-3.5 rounded-full text-sm transition-all shadow-lg shadow-[#9B2B47]/20">
            {banner.buttonLabel || "Shop Now"} <ArrowRight size={15} />
          </a>
          <Link href="/track" className="inline-flex items-center gap-2 bg-white border border-[#EDE8E4] text-[#6B6B6B] hover:text-[#9B2B47] hover:border-[#9B2B47] font-medium px-7 py-3.5 rounded-full text-sm transition-all">
            <Package size={14} /> Track My Order
          </Link>
        </div>
        <div className="mt-10 flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} className="fill-[#C9A84C] text-[#C9A84C]" />)}
          </div>
          <span className="text-xs text-[#6B6B6B] font-medium">4.8 · 500+ reviews from across Pakistan</span>
        </div>
      </div>
    </section>
  );
}

function PromoBanner({ banner, deliveryCharge }: { banner: MarketingBanner; deliveryCharge: number }) {
  const hasMedia = Boolean(banner.videoUrl || banner.imageUrl);

  return (
    <section
      className="mt-12 rounded-3xl p-8 text-white text-center overflow-hidden relative"
      style={{ backgroundColor: banner.backgroundColor || undefined, color: banner.textColor || undefined }}
    >
      {banner.videoUrl ? (
        <video
          src={banner.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : banner.imageUrl ? (
        <Image src={banner.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 960px" className="object-cover" />
      ) : (
        <div className="absolute inset-0 hero-animated" />
      )}
      <div className={`absolute inset-0 ${hasMedia ? "bg-[#1A1A1A]/35" : "bg-[#1A1A1A]/10"}`} />
      <div className="relative z-10">
        {banner.eyebrow && <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/70 mb-3">{banner.eyebrow}</p>}
        <h3 className="font-serif font-bold text-2xl mb-2">
          {banner.title.replace("{deliveryCharge}", deliveryCharge.toLocaleString())}
        </h3>
        {banner.body && <p className="text-sm text-white/80 mb-6">{banner.body}</p>}
        {banner.href && (
          <a href={banner.href} className="inline-flex items-center gap-2 bg-white text-[#9B2B47] font-semibold px-7 py-3 rounded-full text-sm hover:scale-105 transition-transform shadow-lg">
            {banner.buttonLabel || "Shop Now"} <ArrowRight size={14} />
          </a>
        )}
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: <Leaf size={14} />, text: "All Natural" },
    { icon: <Shield size={14} />, text: "No Harsh Chemicals" },
    { icon: <Truck size={14} />, text: "Pakistan-wide Delivery" },
    { icon: <Package size={14} />, text: "Cash on Delivery" },
    { icon: <Star size={14} />, text: "500+ Reviews" },
  ];

  return (
    <div className="border-y border-[#EDE8E4] bg-white py-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-8 px-5 min-w-max mx-auto justify-center">
        {items.map(item => (
          <div key={item.text} className="flex items-center gap-2 text-[#6B6B6B] text-xs font-medium whitespace-nowrap">
            <span className="text-[#9B2B47]">{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductSection({ section, products }: { section: MarketingBanner; products: Product[] }) {
  return (
    <section className="max-w-5xl mx-auto px-5 pt-14" id="products">
      <div className="mb-8 text-center">
        {section.eyebrow && <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/60 mb-2">{section.eyebrow}</p>}
        <h2 className="font-serif font-bold text-3xl text-[#1A1A1A]">{section.title}</h2>
        {section.body && <p className="text-sm text-[#6B6B6B] mt-2 max-w-xs mx-auto">{section.body}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index === 0} />
        ))}
      </div>
    </section>
  );
}

function BundleSection({ section, bundles }: { section: MarketingBanner; bundles: Bundle[] }) {
  if (bundles.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-5 pt-16">
      <div className="text-center mb-8">
        {section.eyebrow && <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/60 mb-2">{section.eyebrow}</p>}
        <h2 className="font-serif font-bold text-3xl text-[#1A1A1A]">{section.title}</h2>
        {section.body && <p className="text-sm text-[#6B6B6B] mt-2">{section.body}</p>}
      </div>
      <div className="space-y-4">
        {bundles.map(bundle => <BundleCard key={bundle.id} bundle={bundle} />)}
      </div>
    </section>
  );
}

function IngredientsSection({ section }: { section: MarketingBanner }) {
  return (
    <section className="max-w-5xl mx-auto px-5 pt-16">
      <div className="bg-white rounded-3xl border border-[#EDE8E4] p-8 md:p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F9ECF0] rounded-2xl mb-5">
          <Leaf size={22} className="text-[#9B2B47]" />
        </div>
        <h2 className="font-serif font-bold text-2xl text-[#1A1A1A] mb-3">{section.title}</h2>
        {section.body && (
          <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-xl mx-auto">{section.body}</p>
        )}
      </div>
    </section>
  );
}

function ReviewsBlock({ section }: { section: MarketingBanner }) {
  return (
    <section className="max-w-5xl mx-auto px-5 pt-16">
      <div className="text-center mb-8">
        {section.eyebrow && <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/60 mb-2">{section.eyebrow}</p>}
        <h2 className="font-serif font-bold text-3xl text-[#1A1A1A]">{section.title}</h2>
      </div>
      <ReviewsSection />
    </section>
  );
}

function TrackLinkSection({ section }: { section: MarketingBanner }) {
  return (
    <div className="max-w-5xl mx-auto px-5 pt-8 text-center">
      <Link href={section.href || "/track"} className="inline-flex items-center gap-2 text-[#9B2B47] font-medium text-sm hover:underline underline-offset-2">
        <Package size={14} /> {section.title} →
      </Link>
    </div>
  );
}

function PromoSection({ section, deliveryCharge }: { section: MarketingBanner; deliveryCharge: number }) {
  return (
    <div className="max-w-5xl mx-auto px-5">
      <PromoBanner banner={section} deliveryCharge={deliveryCharge} />
    </div>
  );
}

function ProductCard({ product, priority }: { product: Product; priority: boolean }) {
  const [qty, setQty] = useState(1);
  const [selectedShade, setSelectedShade] = useState("");
  const [added, setAdded] = useState(false);
  const { addItem, items } = useCartStore();
  const inCart = items.some(i => i.productId === product.id);
  const savings = product.oldPrice ? product.oldPrice - product.price : 0;
  const savingsPct = product.oldPrice ? Math.round((savings / product.oldPrice) * 100) : 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (product.needsShade && !selectedShade) {
      window.location.href = `/product/${product.id}`;
      return;
    }
    addItem(product, qty, selectedShade || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="product-card bg-white rounded-3xl border border-[#EDE8E4] overflow-hidden">
      <Link href={`/product/${product.id}`} className="block relative bg-[#F2EDE8] h-64 overflow-hidden group">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-8xl">{product.emoji}</span>
          </div>
        )}
        {savingsPct > 0 && (
          <span className="absolute top-3 left-3 bg-[#9B2B47] text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
            -{savingsPct}% OFF
          </span>
        )}
        {product.badge && (
          <span className="absolute top-3 right-3 bg-white text-[#9B2B47] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#EDE8E4] shadow-sm">
            {product.badge}
          </span>
        )}
        {inCart && (
          <div className="absolute bottom-3 right-3 bg-[#9B2B47] text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold shadow-md">
            <CheckCircle size={11} /> In Cart
          </div>
        )}
      </Link>

      <div className="p-5 space-y-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-serif font-bold text-[#1A1A1A] text-lg leading-tight hover:text-[#9B2B47] transition-colors">
            {product.name}
          </h3>
          {product.subtitle && <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{product.subtitle}</p>}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="font-bold text-[#9B2B47] text-xl">Rs. {product.price.toLocaleString()}</span>
          {product.oldPrice && <span className="text-sm text-[#6B6B6B] line-through">Rs. {product.oldPrice.toLocaleString()}</span>}
        </div>

        {product.needsShade && product.shades.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#6B6B6B] font-medium">Shade:</span>
              <span className={`text-xs ${selectedShade ? "text-[#9B2B47] font-semibold" : "text-[#6B6B6B] italic"}`}>
                {selectedShade || "choose one"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.shades.map(s => (
                <button
                  key={s.name}
                  onClick={() => setSelectedShade(s.name)}
                  title={s.name}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    selectedShade === s.name ? "border-[#9B2B47] scale-110 shadow-md ring-2 ring-[#9B2B47]/20" : "border-[#EDE8E4] shadow-sm"
                  }`}
                  style={{ backgroundColor: s.hex ?? "#ccc" }}
                />
              ))}
            </div>
          </div>
        )}

        <UrgencyBadge productId={product.id} stock={product.stock} compact />

        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-2 bg-[#FAF7F4] rounded-full px-3 py-2 border border-[#EDE8E4]">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-5 h-5 rounded-full text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white transition-all">
              <Minus size={10} />
            </button>
            <span className="font-bold text-[#1A1A1A] text-sm w-4 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-5 h-5 rounded-full text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white transition-all">
              <Plus size={10} />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className={`btn-ripple flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
              added ? "bg-green-600" : "bg-[#9B2B47] hover:bg-[#7D1E35] active:scale-95"
            }`}
          >
            {added ? <><CheckCircle size={14} /> Added</> : <><ShoppingBag size={14} /> Add to Cart</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function BundleCard({ bundle }: { bundle: Bundle }) {
  const { addBundle, items } = useCartStore();
  const [added, setAdded] = useState(false);
  const inCart = items.some(i => i.productId === bundle.id && i.isBundle);
  const savings = bundle.oldPrice - bundle.price;

  function handleAdd() {
    addBundle(bundle);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="product-card bg-white rounded-3xl border border-[#EDE8E4] p-5 flex gap-4">
      <Link href={`/bundle/${bundle.id}`} className="relative w-16 h-16 rounded-2xl bg-[#F9ECF0] flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
        {bundle.imageUrl ? (
          <Image src={bundle.imageUrl} alt={bundle.name} fill sizes="64px" className="object-cover" />
        ) : (
          <span>{bundle.emoji}</span>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/bundle/${bundle.id}`}>
            <h3 className="font-serif font-bold text-[#1A1A1A] text-sm leading-tight hover:text-[#9B2B47]">{bundle.name}</h3>
          </Link>
          {inCart && <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Added</span>}
        </div>
        <p className="text-xs text-[#6B6B6B] mt-1 leading-snug">{bundle.includes}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="font-bold text-[#9B2B47]">Rs. {bundle.price.toLocaleString()}</span>
          {bundle.oldPrice > 0 && <span className="text-xs text-[#6B6B6B] line-through">Rs. {bundle.oldPrice.toLocaleString()}</span>}
          {savings > 0 && (
            <span className="text-[10px] bg-[#C9A84C]/10 text-[#9A7A2C] border border-[#C9A84C]/30 px-2 py-0.5 rounded-full font-semibold">
              Save Rs. {savings.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleAdd}
        className={`btn-ripple self-center flex-shrink-0 px-4 py-2 rounded-full font-semibold text-xs text-white transition-all duration-300 ${
          added ? "bg-green-600" : "bg-[#9B2B47] hover:bg-[#7D1E35] active:scale-95"
        }`}
      >
        {added ? "Added" : "Add"}
      </button>
    </div>
  );
}

export default function ShopClient({ products, bundles, settings }: Props) {
  const deliveryCharge = settings.deliveryCharge;
  const sections = orderedSections(settings.banners);

  return (
    <div className="min-h-screen bg-[#FAF7F4] pb-20">
      <StoreNav />
      <CartDrawer initialDelivery={deliveryCharge} />
      <WhatsAppButton />
      <EmailCapture />

      {sections.map(section => {
        const type = sectionType(section);
        if (type === "announcement") return <AnnouncementTicker key={section.id} banners={[section]} />;
        if (type === "hero") return <HeroBanner key={section.id} banner={section} />;
        if (type === "trust") return <TrustStrip key={section.id} />;
        if (type === "products") return <ProductSection key={section.id} section={section} products={products} />;
        if (type === "bundles") return <BundleSection key={section.id} section={section} bundles={bundles} />;
        if (type === "ingredients") return <IngredientsSection key={section.id} section={section} />;
        if (type === "reviews") return <ReviewsBlock key={section.id} section={section} />;
        if (type === "trackLink") return <TrackLinkSection key={section.id} section={section} />;
        return <PromoSection key={section.id} section={section} deliveryCharge={deliveryCharge} />;
      })}
    </div>
  );
}
