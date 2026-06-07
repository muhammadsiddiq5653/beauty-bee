"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Check, Minus, Package, Plus,
  ShoppingBag, Sparkles, Star, Trash2
} from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import DuoShadeModal from "@/components/DuoShadeModal";
import EmailCapture from "@/components/EmailCapture";
import { useCartStore } from "@/store/cart";
import type { Bundle, Product, Shade } from "@/types";
import type { StoreSettings } from "@/lib/firestore";

const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  products: Product[];
  bundles: Bundle[];
  settings: StoreSettings;
}

type ShadeView = Shade & {
  id: string;
  vibe: string;
  desc: string;
  img: string;
};

const LOCAL_SHADE_IMAGES = [
  "/beauty-bee/tint-redberry.jpeg",
  "/beauty-bee/tint-pinkrose.jpeg",
  "/beauty-bee/tint-peachy.jpeg",
];

const REELS = [
  { src: "/beauty-bee/reel-a.mp4", poster: "/beauty-bee/poster-reel-a.jpg", label: "Summer tint look" },
  { src: "/beauty-bee/reel-b.mp4", poster: "/beauty-bee/poster-reel-b.jpg", label: "Full glam tint test" },
  { src: "/beauty-bee/reel-c.mp4", poster: "/beauty-bee/poster-reel-c.jpg", label: "Cheek tint demo" },
  { src: "/beauty-bee/reel-d.mp4", poster: "/beauty-bee/poster-reel-d.jpg", label: "Everyday Red Berry" },
  { src: "/beauty-bee/reel-biz.mp4", poster: "/beauty-bee/poster-reel-biz.jpg", label: "Beauty Bee routine" },
];

const REVIEWS = [
  { name: "Aisha K.", city: "Lahore", shade: "Red Berry", hex: "#A52647", text: "This is THE tint. I wore it to a wedding and got compliments all night. It fades softly and never cracks.", date: "3 days ago" },
  { name: "Maryam S.", city: "Karachi", shade: "Pink Rose", hex: "#D26B86", text: "Finally a tint that looks natural on desi skin tones. Pink Rose is my everyday shade now.", date: "1 week ago" },
  { name: "Fatima R.", city: "Islamabad", shade: "Peachy Pop", hex: "#EA8A63", text: "Love the peachy shade for summer. Goes on smooth and the packaging is adorable.", date: "2 weeks ago" },
  { name: "Zara A.", city: "Rawalpindi", shade: "Red Berry", hex: "#A52647", text: "Ordered the bundle and my sisters keep borrowing it. Already reordering.", date: "3 weeks ago" },
];

const FAQ = [
  ["What are the ingredients?", "Our tint is built around natural oils, waxes, vitamin E, and mineral pigments. No harsh fragrance or heavy feel."],
  ["How long does shipping take?", "Most Pakistan orders arrive in 2 to 5 working days. You can track your parcel after checkout."],
  ["Do you offer Cash on Delivery?", "Yes. Beauty Bee supports COD on active delivery cities through PostEx."],
  ["Can I use it on cheeks too?", "Yes. Dab lightly on cheeks, blend with fingertips, and layer if you want more color."],
];

function primaryTint(products: Product[]) {
  return (
    products.find(p => p.id === "tint") ??
    products.find(p => p.needsShade) ??
    products.find(p => p.name.toLowerCase().includes("tint")) ??
    products[0]
  );
}

function shadeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function shadeVibe(name: string, index: number) {
  const lower = name.toLowerCase();
  if (lower.includes("berry") || lower.includes("red")) return "Bold";
  if (lower.includes("rose") || lower.includes("pink") || lower.includes("nude")) return "Soft";
  if (lower.includes("peach") || lower.includes("coral")) return "Fresh";
  return ["Bold", "Soft", "Fresh", "Glow"][index % 4];
}

function shadeDesc(name: string, index: number) {
  const lower = name.toLowerCase();
  if (lower.includes("berry") || lower.includes("red")) return "A deep, confident berry. The one that turns heads at dinner.";
  if (lower.includes("rose") || lower.includes("pink") || lower.includes("nude")) return "Your-lips-but-better rose. Effortless, every single day.";
  if (lower.includes("peach") || lower.includes("coral")) return "Sun-warmed peach that wakes up your whole face.";
  return ["Buildable color for day-to-night glow.", "A soft flush that blends into skin.", "Fresh warmth for lips and cheeks.", "A little dewy lift for every look."][index % 4];
}

function buildShades(product: Product | undefined): ShadeView[] {
  const source = product?.shades?.length
    ? product.shades
    : [
      { name: "Red Berry", hex: "#A52647" },
      { name: "Pink Rose", hex: "#D26B86" },
      { name: "Peachy Pop", hex: "#EA8A63" },
    ];

  return source.slice(0, 4).map((shade, index) => ({
    ...shade,
    id: shadeSlug(shade.name),
    hex: shade.hex ?? ["#A52647", "#D26B86", "#EA8A63", "#B45A72"][index % 4],
    vibe: shadeVibe(shade.name, index),
    desc: shadeDesc(shade.name, index),
    img: LOCAL_SHADE_IMAGES[index % LOCAL_SHADE_IMAGES.length] ?? shade.imageUrl ?? product?.imageUrl ?? "",
  }));
}

function Mesh() {
  return (
    <div className="bb-mesh" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function ProductShot({ shades, active, alt }: { shades: ShadeView[]; active: number; alt: string }) {
  return (
    <div className="bb-shot">
      {shades.map((shade, index) => (
        <Image
          key={shade.id}
          src={shade.img}
          alt={index === active ? `${alt} in ${shade.name}` : ""}
          fill
          priority={index === active}
          sizes="(max-width: 720px) 100vw, 430px"
          className={index === active ? "is-on" : ""}
        />
      ))}
    </div>
  );
}

function Hero({
  tint,
  shades,
  active,
  cartCount,
}: {
  tint: Product;
  shades: ShadeView[];
  active: number;
  cartCount: number;
}) {
  const shade = shades[active];

  return (
    <header className="bb-hero" id="top" style={{ "--bb-shade": shade.hex, "--bb-shade-glow": `${shade.hex}70` } as React.CSSProperties}>
      <div className="bb-announce bb-glass">
        <span className="bb-announce-dot" /> Free delivery on eligible orders - Cash on Delivery
      </div>

      <div>
        <span className="bb-eyebrow">Pakistan&apos;s Favourite Organic Tint</span>
        <h1 className="bb-hero-title">
          Your Lips.<br /><em>Your Mood.</em>
        </h1>
        <p className="bb-hero-sub">
          {tint.name}. Three living shades. All-day color that feels like nothing.
        </p>
        <div className="bb-hero-cta">
          <a className="bb-btn bb-btn-primary" href="#shades">
            Shop the Tint <ArrowRight size={18} />
          </a>
          <Link className="bb-btn bb-btn-ghost" href="/track">Track My Order</Link>
        </div>

        <div className="bb-trust-row">
          <span><strong>4.8</strong>500+ reviews</span>
          <i />
          <span><strong>COD</strong>Pay on delivery</span>
          <i />
          <span><strong>{cartCount}</strong>in your cart</span>
        </div>
      </div>
    </header>
  );
}

function ShadeExperience({
  tint,
  shades,
  active,
  setActive,
}: {
  tint: Product;
  shades: ShadeView[];
  active: number;
  setActive: (index: number) => void;
}) {
  const shade = shades[active];

  return (
    <section className="bb-section" id="shades" style={{ "--bb-shade": shade.hex, "--bb-shade-glow": `${shade.hex}70` } as React.CSSProperties}>
      <div className="bb-section-head">
        <span className="bb-eyebrow">The Collection</span>
        <h2 className="bb-section-title">Tap a shade.<br /><em>See it live.</em></h2>
        <p className="bb-section-sub">Real tints, one organic formula. Lips and cheeks, all day.</p>
      </div>

      <div className="bb-shade-showcase">
        <div className="bb-shotcard w-[min(82vw,360px)]">
          <ProductShot shades={shades} active={active} alt={tint.name} />
        </div>
        <div className="bb-shade-copy">
          <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: shade.hex }}>{shade.vibe}</span>
          <h3 className="bb-shade-name">{shade.name}</h3>
          <p className="mx-auto mt-2 max-w-[30ch] text-[15px] font-semibold leading-relaxed text-[var(--bb-ink-soft)]">{shade.desc}</p>
        </div>
      </div>

      <div className="bb-swatches" role="tablist" aria-label="Choose a shade">
        {shades.map((item, index) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={index === active}
            className={`bb-swatch ${index === active ? "is-active" : ""}`}
            onClick={() => setActive(index)}
            style={{ "--c": item.hex } as React.CSSProperties}
          >
            <span className="bb-swatch-dot" />
            <span className="flex-1">
              <span className="bb-swatch-name">{item.name}</span>
              <span className="bb-swatch-vibe">{item.vibe}</span>
            </span>
            {index === active ? <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: item.hex }}><Check size={14} /></span> : null}
          </button>
        ))}
      </div>

      <p className="mt-7 text-center text-[15px] font-semibold text-[var(--bb-ink-soft)]">
        Can&apos;t decide? <a href="#bundles" className="font-black text-[var(--bb-berry)]">Get a bundle</a>.
      </p>
    </section>
  );
}

function HowToApply() {
  const steps = [
    ["01", "Dab", "Dot the tint on lips or cheeks. A little goes a long way."],
    ["02", "Blend", "Pat and blend with your fingertip for a natural dewy finish."],
    ["03", "Glow", "Layer lightly for more color. It fades softly through the day."],
  ];

  return (
    <section className="bb-section" id="howto">
      <div className="bb-section-head">
        <span className="bb-eyebrow">Simple as 1-2-3</span>
        <h2 className="bb-section-title">How to<br /><em>apply.</em></h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {steps.map(([num, title, desc]) => (
          <div key={num} className="bb-glass rounded-[22px] p-4 text-center">
            <Sparkles className="mx-auto mb-3 text-[var(--bb-berry)]" size={28} />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--bb-berry)]">{num}</span>
            <h3 className="bb-serif mt-1 text-2xl text-[var(--bb-ink)]">{title}</h3>
            <p className="mt-2 text-[12px] font-semibold leading-relaxed text-[var(--bb-ink-soft)]">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReelWall() {
  return (
    <section className="bb-section" id="why">
      <div className="bb-section-head">
        <span className="bb-eyebrow">Real People, Real Tint</span>
        <h2 className="bb-section-title">Seen on<br /><em>every feed.</em></h2>
      </div>
      <div className="bb-reel-grid">
        {REELS.map(reel => (
          <div className="bb-reel-card" key={reel.src}>
            <video src={reel.src} poster={reel.poster} autoPlay muted loop playsInline preload="metadata" />
            <div className="bb-reel-handle">{reel.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  const canQuickAdd = !product.needsShade;

  return (
    <article className="bb-product-card bb-glass">
      <Link href={`/product/${product.id}`} className="bb-product-media">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 720px) 100vw, 360px" className="object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-7xl">{product.emoji}</span>
        )}
      </Link>
      <div className="bb-product-body">
        <Link href={`/product/${product.id}`}>
          <span className="bb-eyebrow">{product.badge || product.subtitle || "Beauty Bee"}</span>
          <h3 className="bb-serif mt-2 text-3xl leading-none text-[var(--bb-ink)]">{product.name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">{product.description}</p>
        <div className="mt-4 flex items-baseline gap-2">
          <strong className="bb-serif text-3xl text-[var(--bb-berry)]">Rs. {product.price.toLocaleString()}</strong>
          {product.oldPrice ? <s className="text-sm font-semibold text-[var(--bb-ink-soft)]">Rs. {product.oldPrice.toLocaleString()}</s> : null}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center rounded-full bg-white/60 p-1">
            <button className="grid h-8 w-8 place-items-center rounded-full text-[var(--bb-berry)]" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={13} /></button>
            <span className="w-7 text-center text-sm font-black">{qty}</span>
            <button className="grid h-8 w-8 place-items-center rounded-full text-[var(--bb-berry)]" onClick={() => setQty(qty + 1)}><Plus size={13} /></button>
          </div>
          {canQuickAdd ? (
            <button className="bb-btn bb-btn-primary flex-1 px-4 py-3 text-sm" onClick={() => addItem(product, qty)}>
              Add
            </button>
          ) : (
            <Link className="bb-btn bb-btn-primary flex-1 px-4 py-3 text-sm" href={`/product/${product.id}`}>
              Choose shade
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function BundleCard({ bundle, shadeOptions }: { bundle: Bundle; shadeOptions: Shade[] }) {
  const { addBundle } = useCartStore();
  const save = Math.max(0, bundle.oldPrice - bundle.price);
  const [modalOpen, setModalOpen] = useState(false);
  const needsShades = (bundle.shadeSlotCount ?? 0) > 0 && shadeOptions.length > 0;

  function handleClick() {
    if (needsShades) {
      setModalOpen(true);
    } else {
      addBundle(bundle);
    }
  }

  return (
    <>
      <article className="bb-product-card bb-glass" id={bundle.id}>
        <Link href={`/bundle/${bundle.id}`} className="bb-product-media">
          {bundle.imageUrl ? (
            <Image src={bundle.imageUrl} alt={bundle.name} fill sizes="(max-width: 720px) 100vw, 520px" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center bg-[var(--bb-cream-deep)] text-7xl">{bundle.emoji}</div>
          )}
        </Link>
        <div className="bb-product-body">
          <span className="bb-eyebrow">Save More</span>
          <h3 className="bb-serif mt-2 text-3xl leading-none text-[var(--bb-ink)]">{bundle.name}</h3>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">{bundle.includes}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <strong className="bb-serif text-3xl text-[var(--bb-berry)]">Rs. {bundle.price.toLocaleString()}</strong>
            {bundle.oldPrice ? <s className="text-sm font-semibold text-[var(--bb-ink-soft)]">Rs. {bundle.oldPrice.toLocaleString()}</s> : null}
            {save > 0 ? <span className="rounded-full bg-[var(--bb-berry)] px-3 py-1 text-xs font-black text-white">Save Rs. {save.toLocaleString()}</span> : null}
          </div>
          <button className="bb-btn bb-btn-primary mt-5 w-full" onClick={handleClick}>
            {needsShades ? "Pick shades →" : <>Get the bundle <ArrowRight size={17} /></>}
          </button>
        </div>
      </article>

      {modalOpen && (
        <DuoShadeModal
          bundle={bundle}
          shadeOptions={shadeOptions}
          shadeSlotCount={bundle.shadeSlotCount ?? 2}
          onClose={() => setModalOpen(false)}
          onConfirm={(shadeLabel) => {
            addBundle(bundle, shadeLabel);
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function Reviews() {
  return (
    <section className="bb-section" id="reviews">
      <div className="bb-section-head">
        <span className="bb-eyebrow">Loved by 500+</span>
        <h2 className="bb-section-title">What they&apos;re<br /><em>saying.</em></h2>
      </div>
      <div className="mb-7 grid place-items-center">
        <strong className="bb-serif text-5xl leading-none text-[var(--bb-ink)]">4.8</strong>
        <div className="mt-2 flex gap-1 text-[#f5a623]">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={17} fill="currentColor" />)}</div>
        <span className="mt-1 text-xs font-semibold text-[var(--bb-ink-soft)]">Based on hundreds of local reviews</span>
      </div>
      <div className="bb-card-list">
        {REVIEWS.map(review => (
          <article key={review.name} className="bb-glass rounded-[20px] p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bb-berry)] text-sm font-black text-white">{review.name[0]}</span>
              <span className="flex-1">
                <strong className="block text-sm">{review.name}</strong>
                <span className="text-xs font-semibold text-[var(--bb-ink-soft)]">{review.city} - {review.date}</span>
              </span>
              <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black text-green-600">Verified</span>
            </div>
            <div className="mt-3 flex gap-1 text-[#f5a623]">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}</div>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--bb-ink)]">&quot;{review.text}&quot;</p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[var(--bb-ink-soft)]">
              <i className="bb-review-dot h-4 w-4" style={{ background: review.hex }} /> {review.shade}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function FAQBlock({ whatsappNumber }: { whatsappNumber: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const wa = whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923080014581";

  return (
    <section className="bb-section" id="faq">
      <div className="bb-section-head">
        <span className="bb-eyebrow">Got Questions?</span>
        <h2 className="bb-section-title">We&apos;ve got<br /><em>answers.</em></h2>
      </div>
      <div className="grid gap-2">
        {FAQ.map(([q, a], index) => (
          <article key={q} className="overflow-hidden rounded-[18px] border border-[rgba(155,43,71,0.09)] bg-white/60">
            <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-black text-[var(--bb-ink)]" onClick={() => setOpen(open === index ? null : index)}>
              {q}
              <Plus className={`transition-transform ${open === index ? "rotate-45" : ""}`} size={18} />
            </button>
            {open === index ? <p className="px-5 pb-5 text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">{a}</p> : null}
          </article>
        ))}
      </div>
      <div className="mt-7 grid place-items-center gap-3 text-center">
        <p className="text-sm font-semibold text-[var(--bb-ink-soft)]">Still have questions?</p>
        <a className="bb-btn bb-btn-ghost" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">Chat with us</a>
      </div>
    </section>
  );
}

function StickyBar({
  product,
  shade,
  total,
  freeDeliveryThreshold,
}: {
  product: Product;
  shade: ShadeView;
  total: number;
  freeDeliveryThreshold: number;
}) {
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);
  const threshold = freeDeliveryThreshold > 0 ? freeDeliveryThreshold : 1200;
  const remaining = Math.max(0, threshold - total);
  const pct = Math.min(100, (total / threshold) * 100);

  function add() {
    addItem(product, 1, shade.name);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="bb-sticky bb-glass" style={{ "--bb-shade": shade.hex } as React.CSSProperties}>
      <div className="mb-2">
        <div className="bb-freebar-track"><div className="bb-freebar-fill" style={{ width: `${pct}%` }} /></div>
        <span className="bb-freebar-label">
          {remaining === 0 && total > 0 ? "Free delivery unlocked" : `Rs. ${remaining.toLocaleString()} away from free delivery`}
        </span>
      </div>
      <div className="bb-sticky-row">
        <span className="bb-sticky-dot" style={{ background: shade.hex }} />
        <div className="min-w-0 flex-1">
          <strong className="bb-serif block truncate text-xl leading-none">{shade.name}</strong>
          <span className="text-sm font-black text-[var(--bb-berry)]">Rs. {product.price.toLocaleString()}</span>
          {product.oldPrice ? <s className="ml-2 text-xs font-semibold text-[var(--bb-ink-soft)]">Rs. {product.oldPrice.toLocaleString()}</s> : null}
        </div>
        <button className={`bb-btn bb-btn-primary min-w-[144px] px-4 ${added ? "bg-green-600" : ""}`} onClick={add}>
          {added ? <><Check size={17} /> Added</> : <><Plus size={17} /> Add</>}
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bb-footer">
      <Image src="/logo.svg" alt="Beauty Bee" width={130} height={52} className="mx-auto brightness-0 invert opacity-80" />
      <p className="bb-serif mt-4 text-xl italic text-white/55">Pakistan&apos;s favourite organic tint.</p>
      <div className="mt-5 flex justify-center gap-5 text-sm font-black">
        <Link href="/track">Track Order</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/about">About</Link>
      </div>
      <p className="mt-5 text-xs text-white/35">© 2026 Beauty Bee. All rights reserved.</p>
    </footer>
  );
}

function CartMiniButton() {
  const { itemCount, openDrawer } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <button className="bb-nav-cart" onClick={openDrawer} aria-label="Open cart">
      <ShoppingBag size={20} />
      {mounted && itemCount() > 0 ? <span className="bb-cart-badge">{itemCount() > 9 ? "9+" : itemCount()}</span> : null}
    </button>
  );
}

function GlassNav() {
  return (
    <nav className="bb-nav">
      <div className="bb-nav-inner bb-glass">
        <Link href="/" aria-label="Beauty Bee home">
          <Image src="/logo.svg" alt="Beauty Bee" width={112} height={44} priority unoptimized />
        </Link>
        <div className="bb-nav-links">
          <a href="#shades">Shades</a>
          <a href="#why">Why</a>
          <a href="#bundles">Bundles</a>
        </div>
        <CartMiniButton />
      </div>
    </nav>
  );
}

export default function ShopClient({ products, bundles, settings }: Props) {
  const tint = primaryTint(products);
  const shades = useMemo(() => buildShades(tint), [tint]);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { itemCount, subtotal, removeItem, items } = useCartStore();
  const activeShade = shades[active] ?? shades[0];
  const supportingProducts = products.filter(product => product.id !== tint?.id);
  const total = mounted ? subtotal() : 0;
  const cartCount = mounted ? itemCount() : 0;
  const visibleItems = mounted ? items : [];

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!tint) {
    return (
      <div className="bb-page grid place-items-center px-6 text-center">
        <Mesh />
        <div className="bb-glass rounded-[28px] p-8">
          <Package className="mx-auto text-[var(--bb-berry)]" size={42} />
          <h1 className="bb-serif mt-4 text-3xl">No products found</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--bb-ink-soft)]">Add active products in admin to launch the store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bb-page pb-28">
      <Mesh />
      <GlassNav />
      <CartDrawer
        initialDelivery={settings.deliveryCharge}
        initialFreeDeliveryThreshold={settings.freeDeliveryThreshold}
      />
      <WhatsAppButton />
      <EmailCapture />

      <main className="bb-shell">
        <Hero tint={tint} shades={shades} active={active} cartCount={cartCount} />
        <ShadeExperience tint={tint} shades={shades} active={active} setActive={setActive} />

        {bundles.length > 0 ? (
          <section className="bb-section" id="bundles">
            <div className="bb-section-head">
              <span className="bb-eyebrow">Save More</span>
              <h2 className="bb-section-title">The Bundle<br /><em>edit.</em></h2>
              <p className="bb-section-sub">Build a routine or gift the full mood in one tap.</p>
            </div>
            <div className="bb-card-list">
              {bundles.map(bundle => <BundleCard key={bundle.id} bundle={bundle} shadeOptions={shades} />)}
            </div>
          </section>
        ) : null}

        <ReelWall />
        <HowToApply />

        {supportingProducts.length > 0 ? (
          <section className="bb-section" id="products">
            <div className="bb-section-head">
              <span className="bb-eyebrow">Complete the Ritual</span>
              <h2 className="bb-section-title">More Beauty Bee<br /><em>favorites.</em></h2>
            </div>
            <div className="bb-card-list">
              {supportingProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        ) : null}

        <Reviews />
        <FAQBlock whatsappNumber={settings.whatsappNumber} />

        {visibleItems.length > 0 ? (
          <section className="bb-section">
            <div className="bb-glass rounded-[24px] p-5">
              <span className="bb-eyebrow">In your bag</span>
              <div className="mt-4 grid gap-3">
                {visibleItems.slice(0, 3).map(item => (
                  <div key={item.key} className="flex items-center gap-3 rounded-2xl bg-white/60 p-3">
                    <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[var(--bb-cream-deep)] text-2xl">
                      {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="h-full w-full object-cover" /> : item.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">{item.name}</strong>
                      <span className="text-xs font-semibold text-[var(--bb-ink-soft)]">Qty {item.qty} - Rs. {(item.qty * item.unitPrice).toLocaleString()}</span>
                    </span>
                    <button className="text-[var(--bb-ink-soft)]" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <Link href="/checkout" className="bb-btn bb-btn-primary mt-5 w-full">Checkout - Rs. {total.toLocaleString()}</Link>
            </div>
          </section>
        ) : null}

        <Footer />
      </main>

      <StickyBar
        product={tint}
        shade={activeShade}
        total={total}
        freeDeliveryThreshold={settings.freeDeliveryThreshold}
      />
    </div>
  );
}
