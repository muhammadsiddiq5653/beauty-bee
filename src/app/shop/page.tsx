"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star, ShoppingBag, ArrowRight, Shield, Truck,
  Package, RefreshCw, CheckCircle, Plus, Minus, Sparkles
} from "lucide-react";
import { getProducts, getBundles } from "@/lib/firestore";
import { DEFAULT_PRODUCTS, DEFAULT_BUNDLES } from "@/lib/catalogue";
import { useCartStore } from "@/store/cart";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import PromoBanner from "@/components/PromoBanner";
import ReviewsSection from "@/components/ReviewsSection";
import UrgencyBadge from "@/components/UrgencyBadge";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Product, Bundle } from "@/types";

const DELIVERY = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");

// ── Intersection observer hook for scroll animations ──────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Skeleton card ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="shimmer h-44 w-full" />
      <div className="p-3 space-y-2">
        <div className="shimmer h-4 w-3/4 rounded-full" />
        <div className="shimmer h-3 w-1/2 rounded-full" />
        <div className="shimmer h-8 w-full rounded-full mt-2" />
      </div>
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────────
function ProductCard({ product, index }: { product: Product; index: number }) {
  const { ref, visible } = useReveal();
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
    <div
      ref={ref}
      style={{ animationDelay: `${index * 80}ms`, opacity: visible ? undefined : 0 }}
      className={`product-card bg-white rounded-2xl shadow-sm border border-pink-50 overflow-hidden ${visible ? "animate-slide-up" : ""}`}
    >
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block relative bg-gradient-to-br from-pink-50 via-pink-100 to-rose-100 h-44 overflow-hidden">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-7xl animate-float-slow" style={{ animationDelay: `${index * 300}ms` }}>{product.emoji}</span>
          </div>
        )}
        {/* Badges */}
        {product.badge && (
          <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-fade-in ${product.badgeColor === "green" ? "bg-green-500 text-white" : "bg-[#e91e8c] text-white"}`}>
            {product.badge}
          </span>
        )}
        {savingsPct > 0 && (
          <span className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            -{savingsPct}% OFF
          </span>
        )}
        {inCart && (
          <div className="absolute bottom-2 right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md animate-bounce-in">
            <CheckCircle size={14} />
          </div>
        )}
        {/* Shimmer overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </Link>

      <div className="p-3 space-y-2">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-bold text-[#8b0057] text-sm leading-tight hover:text-[#e91e8c] transition-colors">{product.name}</h3>
          {product.subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{product.subtitle}</p>}
        </Link>

        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-[#e91e8c] text-base">Rs. {product.price.toLocaleString()}</span>
          {product.oldPrice && <span className="text-[11px] text-gray-300 line-through">Rs. {product.oldPrice.toLocaleString()}</span>}
        </div>

        {/* Compact shade dots */}
        {product.needsShade && product.shades.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {product.shades.map(s => (
              <button key={s.name} onClick={() => setSelectedShade(s.name)} title={s.name}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-200 hover:scale-125 ${selectedShade === s.name ? "border-[#e91e8c] scale-110 shadow-md" : "border-white shadow-sm"}`}
                style={{ backgroundColor: s.hex ?? "#ccc" }} />
            ))}
            {!selectedShade && <span className="text-[10px] text-gray-400">tap shade</span>}
          </div>
        )}

        {/* Urgency badge */}
        <UrgencyBadge productId={product.id} stock={product.stock} compact={true} />

        {/* Qty + Add */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex items-center gap-1 bg-pink-50 rounded-full px-2 py-1 border border-pink-100">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-5 h-5 rounded-full text-[#e91e8c] flex items-center justify-center hover:bg-[#e91e8c] hover:text-white transition-all duration-200">
              <Minus size={9} />
            </button>
            <span className="font-black text-[#8b0057] text-xs w-4 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-5 h-5 rounded-full text-[#e91e8c] flex items-center justify-center hover:bg-[#e91e8c] hover:text-white transition-all duration-200">
              <Plus size={9} />
            </button>
          </div>
          <button onClick={handleAdd}
            className={`btn-ripple flex-1 py-2 rounded-full text-xs font-bold text-white transition-all duration-300 flex items-center justify-center gap-1 shadow-sm ${added ? "bg-green-500 scale-105" : "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] hover:shadow-md hover:scale-105 active:scale-95"}`}>
            {added
              ? <><CheckCircle size={12} /> Added! ✓</>
              : <><ShoppingBag size={12} /> Add to Cart</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bundle Card ────────────────────────────────────────────────────
function BundleCard({ bundle, index }: { bundle: Bundle; index: number }) {
  const { ref, visible } = useReveal();
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
    <div
      ref={ref}
      style={{ animationDelay: `${index * 100}ms`, opacity: visible ? undefined : 0 }}
      className={`product-card bg-white rounded-2xl shadow-sm border border-pink-50 p-4 flex gap-4 ${visible ? "animate-slide-in-right" : ""}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center text-3xl flex-shrink-0 shadow-inner">
        <span className="animate-float" style={{ animationDelay: `${index * 200}ms` }}>{bundle.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#8b0057] text-sm leading-tight">{bundle.name}</h3>
          {inCart && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0 animate-bounce-in">In cart ✓</span>}
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{bundle.includes}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="font-black text-[#e91e8c]">Rs. {bundle.price.toLocaleString()}</span>
          {bundle.oldPrice > 0 && <span className="text-xs text-gray-300 line-through">Rs. {bundle.oldPrice.toLocaleString()}</span>}
          {savings > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              Save Rs. {savings.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <button onClick={handleAdd}
        className={`btn-ripple self-center flex-shrink-0 px-4 py-2.5 rounded-full font-bold text-xs text-white transition-all duration-300 shadow ${added ? "bg-green-500 scale-110" : "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] hover:scale-105 hover:shadow-md active:scale-95"}`}>
        {added ? "✓ Added!" : "+ Add"}
      </button>
    </div>
  );
}

// ── Floating Particles ─────────────────────────────────────────────
function FloatingParticles() {
  const particles = ["✨", "🌸", "💕", "⭐", "🌟", "💫", "🌺", "✨"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute text-lg opacity-20 animate-float"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDuration: `${3 + i * 0.5}s`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          {p}
        </div>
      ))}
    </div>
  );
}

// ── Announcement Ticker ────────────────────────────────────────────
function AnnouncementTicker() {
  const items = [
    "🐝 Free delivery on orders above Rs. 1,500",
    "✨ 100% Organic & Natural Ingredients",
    "📦 Cash on Delivery Available Pakistan-wide",
    "⭐ 500+ 5-Star Reviews",
    "🌸 New: Shade Duo Bundle — Mix & Match any 2 Tints",
    "🚚 Fast delivery via PostEx — 2-5 working days",
  ];
  const text = items.join("   ·   ");
  return (
    <div className="bg-[#8b0057] text-white text-xs font-semibold py-2 overflow-hidden">
      <div className="flex whitespace-nowrap animate-ticker">
        <span className="px-4">{text}</span>
        <span className="px-4">{text}</span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [fbProds, fbBunds] = await Promise.all([getProducts(), getBundles()]);
        const activeProds = fbProds.filter(p => p.active !== false);
        const activeBunds = fbBunds.filter(b => b.active !== false);
        if (activeProds.length > 0) {
          setProducts(activeProds);
          setBundles(activeBunds);
        } else {
          throw new Error("empty");
        }
      } catch {
        setProducts(DEFAULT_PRODUCTS.map((p, i) => ({ ...p, id: ["tint", "mask", "serum", "soap"][i] })) as Product[]);
        setBundles(DEFAULT_BUNDLES.map((b, i) => ({ ...b, id: ["starter", "glow", "complete", "duo"][i] })) as Bundle[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf3f9]">
      <StoreNav />
      <CartDrawer />
      <WhatsAppButton />
      <AnnouncementTicker />

      {/* ── Hero Banner ── */}
      <section ref={heroRef} className="hero-animated text-white relative overflow-hidden">
        <FloatingParticles />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-14 flex flex-col items-center text-center">
          {/* Bee icon with glow */}
          <div className="relative mb-4">
            <div className="text-6xl animate-float">🐝</div>
            <div className="absolute inset-0 rounded-full animate-pulse-glow" />
          </div>

          <div className="animate-slide-up">
            <p className="text-xs font-bold tracking-widest uppercase text-white/60 mb-2">Pakistan&apos;s #1 Organic Beauty</p>
            <h1 className="text-4xl font-black leading-tight mb-3 drop-shadow-lg">
              Glow Naturally.<br />
              <span className="text-yellow-300">Feel Beautiful.</span>
            </h1>
            <p className="text-white/80 text-sm max-w-xs mx-auto mb-6 leading-relaxed">
              100% organic skincare & beauty products. Trusted by 500+ women across Pakistan.
            </p>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-7 animate-fade-in delay-300">
            {[
              { icon: <Shield size={11} />, text: "100% Organic" },
              { icon: <Star size={11} />, text: "500+ Reviews" },
              { icon: <Truck size={11} />, text: "COD Available" },
              { icon: <Package size={11} />, text: "Pakistan-wide" },
            ].map((b, i) => (
              <div key={b.text}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold border border-white/20 animate-slide-up"
                style={{ animationDelay: `${300 + i * 80}ms` }}>
                {b.icon} {b.text}
              </div>
            ))}
          </div>

          <a href="#products"
            className="btn-ripple animate-bounce-in delay-500 bg-white text-[#8b0057] font-black px-8 py-3.5 rounded-full text-sm shadow-2xl hover:shadow-pink-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2 group">
            Shop Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40L60 33.3C120 26.7 240 13.3 360 10C480 6.7 600 13.3 720 20C840 26.7 960 33.3 1080 33.3C1200 33.3 1320 26.7 1380 23.3L1440 20V40H0Z" fill="#fdf3f9"/>
          </svg>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-16" id="products">

        {/* ── Animated Promo Banner ── */}
        <div className="mt-6 mb-2">
          <PromoBanner />
        </div>

        {/* ── Promo strip ── */}
        <div className="flex gap-3 mt-6 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { emoji: "🌿", text: "All Natural" },
            { emoji: "💳", text: "Cash on Delivery" },
            { emoji: "🚚", text: "Fast Shipping" },
            { emoji: "↩️", text: "Easy Returns" },
            { emoji: "⭐", text: "5-Star Rated" },
          ].map((p, i) => (
            <div key={p.text}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-white rounded-2xl px-4 py-3 shadow-sm border border-pink-50 animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}>
              <span className="text-xl">{p.emoji}</span>
              <span className="text-[10px] font-bold text-[#8b0057] whitespace-nowrap">{p.text}</span>
            </div>
          ))}
        </div>

        {/* ── Products ── */}
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-black text-[#8b0057] text-xl flex items-center gap-2">
            <Sparkles size={18} className="text-[#e91e8c] animate-sparkle" />
            Products
          </h2>
          <span className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent" />
          {!loading && <span className="text-xs text-gray-400 font-semibold">{products.length} items</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}

        {/* ── Bundle Deals ── */}
        {!loading && bundles.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-black text-[#8b0057] text-xl">🎁 Bundle Deals</h2>
              <span className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent" />
              <span className="text-xs text-white font-bold bg-gradient-to-r from-[#8b0057] to-[#e91e8c] px-2.5 py-1 rounded-full animate-pulse">Best Value</span>
            </div>
            <div className="space-y-3">
              {bundles.map((b, i) => <BundleCard key={b.id} bundle={b} index={i} />)}
            </div>
          </div>
        )}

        {/* ── Customer Reviews ── */}
        {!loading && <ReviewsSection />}

        {/* ── Why Beauty Bee ── */}
        <div className="mt-12">
          <h2 className="font-black text-[#8b0057] text-center text-xl mb-6">Why 500+ Women Choose Beauty Bee 🐝</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "🌿", title: "All Natural", desc: "No harsh chemicals, only the finest organic ingredients", delay: 0 },
              { emoji: "💳", title: "Cash on Delivery", desc: "Pay only when your order arrives — zero risk", delay: 100 },
              { emoji: "📦", title: "Fast Shipping", desc: "Delivered Pakistan-wide via PostEx courier", delay: 200 },
              { emoji: "⭐", title: "500+ 5-Star Reviews", desc: "Trusted and loved by hundreds of customers", delay: 300 },
            ].map((f, i) => {
              const { ref, visible } = useReveal(); // eslint-disable-line react-hooks/rules-of-hooks
              return (
                <div
                  key={f.title}
                  ref={ref}
                  className={`bg-white rounded-2xl p-4 text-center shadow-sm border border-pink-50 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${f.delay}ms` }}
                >
                  <div className="text-3xl mb-2 animate-float" style={{ animationDelay: `${i * 300}ms` }}>{f.emoji}</div>
                  <p className="font-bold text-[#8b0057] text-sm">{f.title}</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Delivery Banner ── */}
        <div className="mt-8 hero-animated rounded-2xl p-5 text-white text-center shadow-lg relative overflow-hidden">
          <FloatingParticles />
          <div className="relative z-10">
            <p className="font-black text-lg">🚚 Flat Rs. {DELIVERY} Delivery Anywhere in Pakistan</p>
            <p className="text-xs text-white/80 mt-1">Cash on Delivery · PostEx Tracking · 2-5 Working Days</p>
            <a href="#products" className="inline-flex items-center gap-2 mt-4 bg-white text-[#8b0057] font-black px-6 py-2.5 rounded-full text-sm hover:scale-105 transition-transform shadow-lg">
              Order Now <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* ── Track order ── */}
        <div className="mt-6 text-center">
          <Link href="/track" className="inline-flex items-center gap-2 text-[#e91e8c] font-semibold text-sm hover:underline">
            <Package size={14} /> Already ordered? Track your parcel →
          </Link>
        </div>
      </div>
    </div>
  );
}
