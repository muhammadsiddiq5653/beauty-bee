"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star, ShoppingBag, ArrowRight, Shield, Truck,
  Package, CheckCircle, Plus, Minus, Sparkles, Leaf
} from "lucide-react";
import { getProducts, getBundles } from "@/lib/firestore";
import { DEFAULT_PRODUCTS, DEFAULT_BUNDLES } from "@/lib/catalogue";
import { useCartStore } from "@/store/cart";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import ReviewsSection from "@/components/ReviewsSection";
import UrgencyBadge from "@/components/UrgencyBadge";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Product, Bundle } from "@/types";

const DELIVERY = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Skeleton ───────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-[#EDE8E4]">
      <div className="shimmer h-64 w-full" />
      <div className="p-5 space-y-3">
        <div className="shimmer h-4 w-2/3 rounded-full" />
        <div className="shimmer h-3 w-1/2 rounded-full" />
        <div className="shimmer h-10 w-full rounded-full mt-3" />
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
      style={{ animationDelay: `${index * 100}ms`, opacity: visible ? undefined : 0 }}
      className={`product-card bg-white rounded-3xl border border-[#EDE8E4] overflow-hidden ${visible ? "animate-slide-up" : ""}`}
    >
      {/* Image */}
      <Link href={`/product/${product.id}`} className="block relative bg-[#F2EDE8] h-64 overflow-hidden group">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-8xl animate-float-slow">{product.emoji}</span>
          </div>
        )}
        {/* Badges */}
        {savingsPct > 0 && (
          <span className="absolute top-3 left-3 bg-[#9B2B47] text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
            −{savingsPct}% OFF
          </span>
        )}
        {product.badge && (
          <span className="absolute top-3 right-3 bg-white text-[#9B2B47] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#EDE8E4] shadow-sm">
            {product.badge}
          </span>
        )}
        {inCart && (
          <div className="absolute bottom-3 right-3 bg-[#9B2B47] text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold animate-bounce-in shadow-md">
            <CheckCircle size={11} /> In Cart
          </div>
        )}
      </Link>

      <div className="p-5 space-y-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-serif font-bold text-[#1A1A1A] text-lg leading-tight hover:text-[#9B2B47] transition-colors">
            {product.name}
          </h3>
          {product.subtitle && (
            <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">{product.subtitle}</p>
          )}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="font-bold text-[#9B2B47] text-xl">Rs. {product.price.toLocaleString()}</span>
          {product.oldPrice && (
            <span className="text-sm text-[#6B6B6B] line-through">Rs. {product.oldPrice.toLocaleString()}</span>
          )}
        </div>

        {/* Shade selector */}
        {product.needsShade && product.shades.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#6B6B6B] font-medium">Shade:</span>
              {selectedShade
                ? <span className="text-xs text-[#9B2B47] font-semibold">{selectedShade}</span>
                : <span className="text-xs text-[#6B6B6B] italic">choose one</span>
              }
            </div>
            <div className="flex flex-wrap gap-2">
              {product.shades.map(s => (
                <button
                  key={s.name}
                  onClick={() => setSelectedShade(s.name)}
                  title={s.name}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                    selectedShade === s.name
                      ? "border-[#9B2B47] scale-110 shadow-md ring-2 ring-[#9B2B47]/20"
                      : "border-[#EDE8E4] shadow-sm"
                  }`}
                  style={{ backgroundColor: s.hex ?? "#ccc" }}
                />
              ))}
            </div>
          </div>
        )}

        <UrgencyBadge productId={product.id} stock={product.stock} compact={true} />

        {/* Qty + CTA */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-2 bg-[#FAF7F4] rounded-full px-3 py-2 border border-[#EDE8E4]">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-5 h-5 rounded-full text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white transition-all"
            >
              <Minus size={10} />
            </button>
            <span className="font-bold text-[#1A1A1A] text-sm w-4 text-center">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-5 h-5 rounded-full text-[#9B2B47] flex items-center justify-center hover:bg-[#9B2B47] hover:text-white transition-all"
            >
              <Plus size={10} />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className={`btn-ripple flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
              added
                ? "bg-green-600"
                : "bg-[#9B2B47] hover:bg-[#7D1E35] active:scale-95"
            }`}
          >
            {added
              ? <><CheckCircle size={14} /> Added</>
              : <><ShoppingBag size={14} /> Add to Cart</>
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
      className={`product-card bg-white rounded-3xl border border-[#EDE8E4] p-5 flex gap-4 ${visible ? "animate-slide-up" : ""}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#F9ECF0] flex items-center justify-center text-3xl flex-shrink-0">
        <span className="animate-float">{bundle.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif font-bold text-[#1A1A1A] text-sm leading-tight">{bundle.name}</h3>
          {inCart && (
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 animate-bounce-in">
              ✓ Added
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B6B6B] mt-1 leading-snug">{bundle.includes}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="font-bold text-[#9B2B47]">Rs. {bundle.price.toLocaleString()}</span>
          {bundle.oldPrice > 0 && (
            <span className="text-xs text-[#6B6B6B] line-through">Rs. {bundle.oldPrice.toLocaleString()}</span>
          )}
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
          added
            ? "bg-green-600"
            : "bg-[#9B2B47] hover:bg-[#7D1E35] active:scale-95"
        }`}
      >
        {added ? "✓ Added" : "Add"}
      </button>
    </div>
  );
}

// ── Announcement Ticker ────────────────────────────────────────────
function AnnouncementTicker() {
  const items = [
    "Free delivery on orders above Rs. 1,500",
    "100% Organic & Natural Ingredients",
    "Cash on Delivery · Pakistan-wide",
    "500+ Five-Star Reviews",
    "Shade Duo Bundle — Mix & Match any 2 Tints",
    "Fast delivery via PostEx · 2–5 working days",
  ];
  const text = items.join("   ·   ");
  return (
    <div className="bg-[#9B2B47] text-white/90 text-[11px] font-medium py-2 overflow-hidden tracking-wide">
      <div className="flex whitespace-nowrap animate-ticker">
        <span className="px-6">{text}</span>
        <span className="px-6">{text}</span>
      </div>
    </div>
  );
}

// ── Trust Strip ────────────────────────────────────────────────────
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
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[#6B6B6B] text-xs font-medium whitespace-nowrap">
            <span className="text-[#9B2B47]">{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature Card (needs own component so useReveal hook is valid) ──
function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`bg-white rounded-3xl p-5 border border-[#EDE8E4] text-center transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 bg-[#F9ECF0] rounded-xl mb-3 text-[#9B2B47]">
        {icon}
      </div>
      <p className="font-semibold text-[#1A1A1A] text-sm">{title}</p>
      <p className="text-[11px] text-[#6B6B6B] mt-1 leading-snug">{desc}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-[#FAF7F4]">
      <StoreNav />
      <CartDrawer />
      <WhatsAppButton />
      <AnnouncementTicker />

      {/* ── Hero ── */}
      <section className="relative bg-[#F2EDE8] overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, #D4627A22 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C9A84C22 0%, transparent 50%)"
          }}
        />
        <div className="relative max-w-5xl mx-auto px-5 py-20 md:py-28 flex flex-col items-center text-center">
          <div className="animate-fade-in">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/70 mb-4">
              Pakistan&apos;s Favourite Organic Tint
            </p>
            <h1 className="font-serif font-bold text-5xl md:text-6xl text-[#1A1A1A] leading-[1.1] mb-4">
              Your Lips.<br />
              <span className="text-[#9B2B47]">Your Mood.</span>
            </h1>
            <p className="text-[#6B6B6B] text-base max-w-sm mx-auto mb-8 leading-relaxed">
              Lip & Cheek Tint in 6 stunning shades — buildable colour, all-day wear, 100% organic.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 animate-slide-up delay-200">
            <a
              href="#products"
              className="btn-ripple inline-flex items-center gap-2 bg-[#9B2B47] hover:bg-[#7D1E35] text-white font-semibold px-8 py-3.5 rounded-full text-sm transition-all duration-300 hover:scale-105 shadow-lg shadow-[#9B2B47]/20 group"
            >
              Shop the Tint
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 bg-white border border-[#EDE8E4] text-[#6B6B6B] hover:text-[#9B2B47] hover:border-[#9B2B47] font-medium px-7 py-3.5 rounded-full text-sm transition-all duration-300"
            >
              <Package size={14} /> Track My Order
            </Link>
          </div>

          {/* Rating pill */}
          <div className="mt-10 flex items-center gap-2 animate-fade-in delay-400">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="fill-[#C9A84C] text-[#C9A84C]" />
              ))}
            </div>
            <span className="text-xs text-[#6B6B6B] font-medium">4.8 · 500+ reviews from across Pakistan</span>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-5 pb-20" id="products">

        {/* ── Products heading ── */}
        <div className="mt-14 mb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/60 mb-2">The Collection</p>
          <h2 className="font-serif font-bold text-3xl text-[#1A1A1A]">
            Lip & Cheek Tint
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-2 max-w-xs mx-auto">
            One product. Six shades. Endless looks.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}

        {/* ── Bundle Deals ── */}
        {!loading && bundles.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/60 mb-2">Save More</p>
              <h2 className="font-serif font-bold text-3xl text-[#1A1A1A]">Complete Your Look</h2>
              <p className="text-sm text-[#6B6B6B] mt-2">Bundle deals crafted to give you the full Beauty Bee experience.</p>
            </div>
            <div className="space-y-4">
              {bundles.map((b, i) => <BundleCard key={b.id} bundle={b} index={i} />)}
            </div>
          </div>
        )}

        {/* ── Ingredients promise ── */}
        {!loading && (
          <div className="mt-16">
            <RevealSection>
              <div className="bg-white rounded-3xl border border-[#EDE8E4] p-8 md:p-10">
                <div className="max-w-xl mx-auto text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F9ECF0] rounded-2xl mb-5">
                    <Leaf size={22} className="text-[#9B2B47]" />
                  </div>
                  <h2 className="font-serif font-bold text-2xl text-[#1A1A1A] mb-3">
                    Pure. Honest. Organic.
                  </h2>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
                    Every Beauty Bee product is formulated without parabens, sulphates, artificial fragrances or harsh chemicals. What goes on your skin should be something you&apos;d be proud of.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                    {["No Parabens", "No Sulphates", "No Artificial Fragrance", "No Mineral Oil", "No Synthetic Dyes", "Cruelty Free"].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[#6B6B6B] font-medium">
                        <CheckCircle size={13} className="text-[#9B2B47] flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        )}

        {/* ── Reviews ── */}
        {!loading && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/60 mb-2">Social Proof</p>
              <h2 className="font-serif font-bold text-3xl text-[#1A1A1A]">What Our Customers Say</h2>
            </div>
            <ReviewsSection />
          </div>
        )}

        {/* ── Why Beauty Bee ── */}
        {!loading && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="font-serif font-bold text-3xl text-[#1A1A1A]">
                Why Women Choose Beauty Bee
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <Leaf size={20} />, title: "All Natural", desc: "Organic ingredients, nothing synthetic" },
                { icon: <Package size={20} />, title: "Cash on Delivery", desc: "Pay only when it arrives" },
                { icon: <Truck size={20} />, title: "Fast Shipping", desc: "Pakistan-wide via PostEx" },
                { icon: <Star size={20} />, title: "500+ Reviews", desc: "Trusted by women across Pakistan" },
              ].map((f, i) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} delay={i * 80} />
              ))}
            </div>
          </div>
        )}

        {/* ── Delivery CTA ── */}
        {!loading && (
          <RevealSection>
            <div className="mt-12 hero-animated rounded-3xl p-8 text-white text-center overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60 mb-3">Nationwide Shipping</p>
                <h3 className="font-serif font-bold text-2xl mb-2">
                  Flat Rs. {DELIVERY} Delivery Anywhere in Pakistan
                </h3>
                <p className="text-sm text-white/75 mb-6">
                  Cash on Delivery · PostEx Tracking · 2–5 Working Days
                </p>
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 bg-white text-[#9B2B47] font-semibold px-7 py-3 rounded-full text-sm hover:scale-105 transition-transform shadow-lg group"
                >
                  Order Now
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </RevealSection>
        )}

        {/* ── Track link ── */}
        <div className="mt-8 text-center">
          <Link href="/track" className="inline-flex items-center gap-2 text-[#9B2B47] font-medium text-sm hover:underline underline-offset-2">
            <Package size={14} /> Already ordered? Track your parcel →
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper: wraps a section in a reveal animation
function RevealSection({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {children}
    </div>
  );
}
