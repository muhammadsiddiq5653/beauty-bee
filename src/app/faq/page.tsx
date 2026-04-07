"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ArrowRight, MessageCircle } from "lucide-react";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? "923001234567";
const WA_MSG = encodeURIComponent("Hi Beauty Bee! I have a question 🌸");

const FAQS: { category: string; emoji: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Orders & Delivery",
    emoji: "📦",
    items: [
      {
        q: "How do I place an order?",
        a: "Simply browse our shop, add your favourite products to the cart, then head to checkout. Fill in your delivery details and hit Place Order — that's it! We'll confirm via WhatsApp and dispatch within 24 hours.",
      },
      {
        q: "Do you offer Cash on Delivery (COD)?",
        a: "Yes! All orders are Cash on Delivery. You pay only when your parcel arrives at your doorstep — no advance payment required. This makes shopping with Beauty Bee completely risk-free.",
      },
      {
        q: "How long does delivery take?",
        a: "We ship via PostEx courier across Pakistan. Delivery typically takes 2-5 working days depending on your city. Major cities like Lahore, Karachi, and Islamabad usually receive orders within 2-3 days.",
      },
      {
        q: "What is the delivery charge?",
        a: "Delivery is a flat Rs. 200 anywhere in Pakistan. We're working on free delivery for orders above a certain amount — stay tuned!",
      },
      {
        q: "How do I track my order?",
        a: "Once your order is dispatched, you'll receive a PostEx tracking number via WhatsApp. You can also use the Track Order link in the store navigation to check your parcel status anytime.",
      },
      {
        q: "Can I change or cancel my order after placing it?",
        a: "Please contact us on WhatsApp as soon as possible after placing your order. If it hasn't been dispatched yet, we can usually make changes or cancellations without any issue.",
      },
    ],
  },
  {
    category: "Products & Ingredients",
    emoji: "🌿",
    items: [
      {
        q: "Are your products really 100% organic?",
        a: "Yes! Every Beauty Bee product is formulated with certified organic ingredients. We never use parabens, sulphates, artificial fragrance, mineral oils, or bleaching agents. You can trust what you're putting on your skin.",
      },
      {
        q: "Are your products suitable for sensitive skin?",
        a: "Absolutely. Our formulations are gentle enough for sensitive skin. However, we always recommend doing a small patch test on your inner wrist 24 hours before full application — just to be safe.",
      },
      {
        q: "Do you test on animals?",
        a: "Never. Beauty Bee is 100% cruelty-free. All our products are tested by our team of willing volunteers and loyal customers — never on animals.",
      },
      {
        q: "How long do products last once opened?",
        a: "Our products have a shelf life of 12 months from the manufacturing date (indicated on packaging). Once opened, store in a cool, dry place away from direct sunlight for best results.",
      },
      {
        q: "Which lip tint shade should I choose?",
        a: "Our Lip & Cheek Tint comes in multiple shades for different skin tones. Rosy Petal and Dusty Rose work beautifully on fair skin, while Berry Blush and Mauve Nude complement medium and deep skin tones. Check the shade swatches on the product page for reference.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    emoji: "↩️",
    items: [
      {
        q: "What is your return policy?",
        a: "If your product arrives damaged or is the wrong item, contact us within 48 hours of receiving your order via WhatsApp with a photo. We'll arrange a replacement or full refund immediately.",
      },
      {
        q: "Can I return a product if I don't like it?",
        a: "Due to hygiene reasons, we cannot accept returns on opened beauty products. However, if you're unsatisfied, please reach out — we'll do our best to find a solution. Customer happiness is our priority.",
      },
      {
        q: "How long do refunds take?",
        a: "Approved refunds are processed within 2-3 working days. The amount will be sent via EasyPaisa, JazzCash, or bank transfer — whichever is most convenient for you.",
      },
    ],
  },
  {
    category: "Promo Codes & Discounts",
    emoji: "🎟️",
    items: [
      {
        q: "Do you offer discount codes?",
        a: "Yes! We regularly share promo codes on our Instagram and WhatsApp. First-time customers can use WELCOME50 for Rs. 50 off. Follow us on Instagram @beautybee.pk for the latest deals.",
      },
      {
        q: "How do I apply a promo code?",
        a: "Add your items to the cart and head to checkout. On the Order Review step, you'll see a Promo Code field. Enter your code and tap Apply — the discount will be reflected in your total instantly.",
      },
      {
        q: "Can I use multiple promo codes on one order?",
        a: "Currently only one promo code can be applied per order. Make sure to use the best one available for your order total.",
      },
      {
        q: "My promo code isn't working — what do I do?",
        a: "Check that the code is entered exactly as shared (codes are case-sensitive). Some codes have minimum order requirements or expiry dates. If it still doesn't work, message us on WhatsApp and we'll sort it out.",
      },
    ],
  },
  {
    category: "Account & Privacy",
    emoji: "🔒",
    items: [
      {
        q: "Do I need to create an account to order?",
        a: "No! You can place orders as a guest — no account needed. Just add to cart and checkout with your delivery details.",
      },
      {
        q: "Is my personal information safe?",
        a: "Absolutely. We only collect your name, phone number, and address to process your delivery. This information is never shared or sold to third parties. We take your privacy very seriously.",
      },
    ],
  },
];

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open ? "border-pink-200 shadow-sm" : "border-gray-100"}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-200 ${open ? "bg-pink-50" : "bg-white hover:bg-pink-50/50"}`}
      >
        <span className={`text-sm font-bold leading-snug ${open ? "text-[#8b0057]" : "text-gray-700"}`}>{q}</span>
        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 ${open ? "bg-[#e91e8c] text-white" : "bg-gray-100 text-gray-400"}`}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-white border-t border-pink-50">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        search === "" ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat =>
    (activeCategory === null || cat.category === activeCategory) &&
    cat.items.length > 0
  );

  const totalResults = filtered.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="min-h-screen bg-[#fdf3f9]">
      <StoreNav />
      <CartDrawer />
      <WhatsAppButton />

      {/* Hero */}
      <section className="hero-animated text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-14 text-center">
          <div className="text-5xl mb-4 animate-float">❓</div>
          <p className="text-xs font-bold tracking-widest uppercase text-white/60 mb-2">Help Centre</p>
          <h1 className="text-3xl font-black mb-3 animate-slide-up">Frequently Asked Questions</h1>
          <p className="text-white/80 text-sm max-w-xs mx-auto">Find answers to common questions about our products, delivery, and more.</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none">
            <path d="M0 40L60 33.3C120 26.7 240 13.3 360 10C480 6.7 600 13.3 720 20C840 26.7 960 33.3 1080 33.3C1200 33.3 1320 26.7 1380 23.3L1440 20V40H0Z" fill="#fdf3f9"/>
          </svg>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-16">

        {/* Search */}
        <div className="mt-8 mb-5 relative">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory(null); }}
            placeholder="Search questions..."
            className="w-full bg-white border border-pink-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-[#e91e8c] shadow-sm pr-10"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 text-sm font-bold">
              ✕
            </button>
          )}
        </div>

        {/* Category chips */}
        {!search && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 ${activeCategory === null ? "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:border-pink-300"}`}>
              All Topics
            </button>
            {FAQS.map(cat => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category === activeCategory ? null : cat.category)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 ${activeCategory === cat.category ? "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:border-pink-300"}`}>
                <span>{cat.emoji}</span> {cat.category}
              </button>
            ))}
          </div>
        )}

        {/* Search results count */}
        {search && (
          <p className="text-xs text-gray-400 mb-4 font-semibold">
            {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>
        )}

        {/* FAQ sections */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-pink-50">
            <div className="text-4xl mb-3">🤔</div>
            <p className="font-bold text-[#8b0057] mb-1">No results found</p>
            <p className="text-sm text-gray-400 mb-4">Try a different search term or browse all categories.</p>
            <button onClick={() => setSearch("")} className="text-[#e91e8c] font-bold text-sm hover:underline">
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((cat, ci) => (
              <div key={cat.category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{cat.emoji}</span>
                  <h2 className="font-black text-[#8b0057] text-base">{cat.category}</h2>
                  <span className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent" />
                  <span className="text-xs text-gray-400">{cat.items.length} questions</span>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item, qi) => (
                    <FaqItem
                      key={item.q}
                      q={item.q}
                      a={item.a}
                      defaultOpen={ci === 0 && qi === 0 && !search}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still have questions CTA */}
        <div className="mt-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100 text-center">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="font-black text-green-800 text-base mb-2">Still have questions?</h3>
          <p className="text-sm text-green-700 mb-5">
            Our team is available on WhatsApp — we typically respond within a few minutes!
          </p>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-black px-6 py-3 rounded-full text-sm shadow-lg hover:scale-105 transition-transform"
          >
            <MessageCircle size={16} />
            Chat on WhatsApp
          </a>
        </div>

        {/* Quick links */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link href="/shop"
            className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-pink-50 hover:border-pink-200 transition-colors group">
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="font-bold text-[#8b0057] text-xs">Browse Products</p>
              <p className="text-[10px] text-gray-400">Shop our full range</p>
            </div>
            <ArrowRight size={14} className="text-pink-300 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/about"
            className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-pink-50 hover:border-pink-200 transition-colors group">
            <span className="text-2xl">🐝</span>
            <div>
              <p className="font-bold text-[#8b0057] text-xs">About Us</p>
              <p className="text-[10px] text-gray-400">Our story and values</p>
            </div>
            <ArrowRight size={14} className="text-pink-300 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}
