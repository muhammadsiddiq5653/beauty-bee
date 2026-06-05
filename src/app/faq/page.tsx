"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle, Search } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import StoreNav from "@/components/StoreNav";
import WhatsAppButton from "@/components/WhatsAppButton";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923080014581";

const FAQS = [
  {
    category: "Orders & Delivery",
    items: [
      ["How do I place an order?", "Add your Beauty Bee products to cart, open checkout, fill your delivery details, and place the COD order."],
      ["Do you offer Cash on Delivery?", "Yes. All active delivery cities support Cash on Delivery, so you pay when the parcel arrives."],
      ["How long does delivery take?", "Most orders arrive within 2 to 5 working days through PostEx, depending on city and courier load."],
      ["How do I track my order?", "Use the Track Order page with your PostEx tracking number or Beauty Bee order reference."],
    ],
  },
  {
    category: "Products & Ingredients",
    items: [
      ["Are your products organic?", "Beauty Bee products are formulated around gentle, naturally derived ingredients and made for daily use."],
      ["Which tint shade should I choose?", "Red Berry is bold, Pink Rose is soft, and Peachy/Coral tones are fresh and warm for everyday glow."],
      ["Can I use the tint on cheeks?", "Yes. Dab a little on cheeks and blend with fingertips for a natural flush."],
      ["Are products suitable for sensitive skin?", "The formulas are gentle, but a patch test is always recommended before first use."],
    ],
  },
  {
    category: "Returns & Promo Codes",
    items: [
      ["Can I change my order?", "Message us quickly on WhatsApp. If the order is not dispatched, we can usually help."],
      ["What if my product arrives damaged?", "Contact us within 48 hours with a photo and your order reference so we can resolve it."],
      ["How do promo codes work?", "Enter the code in checkout during order review. If valid, the discount applies immediately."],
    ],
  },
];

function Mesh() {
  return <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>;
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-[rgba(155,43,71,0.09)] bg-white/60">
      <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-black text-[var(--bb-ink)]" onClick={onToggle}>
        {q}
        <ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} size={18} />
      </button>
      {open ? <p className="px-5 pb-5 text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">{a}</p> : null}
    </article>
  );
}

export default function FAQPage() {
  const [openKey, setOpenKey] = useState("Orders & Delivery-0");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return FAQS.map(group => ({
      ...group,
      items: group.items.filter(([q, a]) => {
        const matchesSearch = !search || `${q} ${a}`.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !activeCategory || activeCategory === group.category;
        return matchesSearch && matchesCategory;
      }),
    })).filter(group => group.items.length > 0);
  }, [search, activeCategory]);

  return (
    <div className="bb-page">
      <Mesh />
      <StoreNav />
      <CartDrawer />
      <WhatsAppButton />

      <main className="bb-shell px-5 py-8 pb-16">
        <div className="bb-section-head">
          <span className="bb-eyebrow">Help Centre</span>
          <h1 className="bb-section-title">Questions,<br /><em>answered.</em></h1>
          <p className="bb-section-sub">Everything about shades, COD, delivery, returns, and promo codes.</p>
        </div>

        <section className="bb-glass rounded-[26px] p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--bb-ink-soft)]" size={17} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search questions..."
              className="bb-input pl-11"
            />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-black ${activeCategory === null ? "bg-[var(--bb-berry)] text-white" : "bg-white/60 text-[var(--bb-ink-soft)]"}`}
            >
              All Topics
            </button>
            {FAQS.map(group => (
              <button
                key={group.category}
                onClick={() => setActiveCategory(group.category === activeCategory ? null : group.category)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-black ${activeCategory === group.category ? "bg-[var(--bb-berry)] text-white" : "bg-white/60 text-[var(--bb-ink-soft)]"}`}
              >
                {group.category}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-8">
          {filtered.length === 0 ? (
            <div className="bb-glass rounded-[24px] p-8 text-center">
              <h2 className="bb-serif text-3xl">No results found</h2>
              <p className="mt-2 text-sm font-semibold text-[var(--bb-ink-soft)]">Try a different search term or browse all topics.</p>
            </div>
          ) : filtered.map(group => (
            <div key={group.category}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="bb-serif text-2xl text-[var(--bb-ink)]">{group.category}</h2>
                <span className="h-px flex-1 bg-[rgba(155,43,71,0.16)]" />
                <span className="text-xs font-black text-[var(--bb-ink-soft)]">{group.items.length}</span>
              </div>
              <div className="grid gap-2">
                {group.items.map(([q, a], index) => {
                  const key = `${group.category}-${index}`;
                  return (
                    <FaqItem
                      key={q}
                      q={q}
                      a={a}
                      open={openKey === key}
                      onToggle={() => setOpenKey(openKey === key ? "" : key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="bb-glass mt-8 rounded-[26px] p-7 text-center">
          <MessageCircle className="mx-auto text-[var(--bb-berry)]" size={36} />
          <h2 className="bb-serif mt-4 text-3xl">Still need help?</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">Message us and we will help with shades, orders, and delivery.</p>
          <a className="bb-btn bb-btn-primary mt-6" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">
            Chat on WhatsApp
          </a>
          <Link href="/shop" className="bb-btn bb-btn-ghost mt-3 w-full">Back to shop</Link>
        </section>
      </main>
    </div>
  );
}
