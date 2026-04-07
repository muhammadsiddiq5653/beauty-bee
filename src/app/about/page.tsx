"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Heart, Leaf, Star, Shield, Package } from "lucide-react";
import StoreNav from "@/components/StoreNav";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const VALUES = [
  {
    emoji: "🌿",
    title: "100% Organic",
    desc: "Every ingredient we use is sourced from nature — no parabens, no sulphates, no harsh chemicals. Just pure, effective botanicals.",
    color: "from-green-50 to-emerald-50 border-green-100",
    iconColor: "text-green-600",
  },
  {
    emoji: "💕",
    title: "Made for Pakistani Women",
    desc: "Our formulations are designed for the Pakistani climate — humid summers, dry winters, and every skin tone in between.",
    color: "from-pink-50 to-rose-50 border-pink-100",
    iconColor: "text-pink-600",
  },
  {
    emoji: "🐝",
    title: "Cruelty Free",
    desc: "We love all creatures. Beauty Bee products are never tested on animals — only on willing human volunteers who rave about the results.",
    color: "from-amber-50 to-yellow-50 border-amber-100",
    iconColor: "text-amber-600",
  },
  {
    emoji: "🤝",
    title: "Community First",
    desc: "We work with local artisans and farmers across Pakistan to source our ingredients, supporting communities at every step.",
    color: "from-purple-50 to-violet-50 border-purple-100",
    iconColor: "text-purple-600",
  },
];

const MILESTONES = [
  { year: "2021", title: "The Beginning", desc: "Founded in a small kitchen in Lahore, mixing the first batch of Honey Lip Tint for family and friends." },
  { year: "2022", title: "Going Online", desc: "Launched on Instagram and got our first 100 orders within a week. The community loved us!" },
  { year: "2023", title: "Product Line Expansion", desc: "Added the Glow Serum, Honey Mask, and Turmeric Soap — each becoming instant bestsellers." },
  { year: "2024", title: "500+ Happy Customers", desc: "Crossed 500 verified 5-star reviews. Expanded delivery to all major cities via PostEx." },
  { year: "2025", title: "Full eCommerce Store", desc: "Launched our dedicated online store with COD, bundle deals, and nationwide same-week delivery." },
];

const TEAM = [
  { emoji: "👩‍🔬", name: "Aisha Malik", role: "Founder & Formulator", desc: "Biochemistry graduate with a passion for natural skincare and helping women feel confident." },
  { emoji: "🎨", name: "Sara Ahmed", role: "Brand & Design", desc: "The creative brain behind Beauty Bee's iconic pink aesthetic and packaging." },
  { emoji: "📦", name: "Usman Khan", role: "Operations & Logistics", desc: "Ensures every order reaches you safely and on time, anywhere in Pakistan." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fdf3f9]">
      <StoreNav />
      <CartDrawer />
      <WhatsAppButton />

      {/* Hero */}
      <section className="hero-animated text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["✨","🌸","💕","🌿","⭐","🐝"].map((p, i) => (
            <div key={i} className="absolute text-2xl opacity-20 animate-float"
              style={{ left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`, animationDuration: `${3 + i * 0.5}s`, animationDelay: `${i * 0.4}s` }}>
              {p}
            </div>
          ))}
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4 animate-float">🐝</div>
          <p className="text-xs font-bold tracking-widest uppercase text-white/60 mb-2 animate-fade-in">Our Story</p>
          <h1 className="text-4xl font-black mb-4 animate-slide-up">About Beauty Bee</h1>
          <p className="text-white/80 max-w-md mx-auto text-sm leading-relaxed animate-fade-in delay-200">
            We believe every woman deserves to feel beautiful — naturally. Beauty Bee was born from a love of organic ingredients and a desire to create products that actually work for Pakistani skin.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none">
            <path d="M0 40L60 33.3C120 26.7 240 13.3 360 10C480 6.7 600 13.3 720 20C840 26.7 960 33.3 1080 33.3C1200 33.3 1320 26.7 1380 23.3L1440 20V40H0Z" fill="#fdf3f9"/>
          </svg>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-16">

        {/* Mission */}
        <RevealSection className="mt-12 bg-white rounded-3xl p-6 shadow-sm border border-pink-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center text-2xl flex-shrink-0">
              🌸
            </div>
            <div>
              <h2 className="font-black text-[#8b0057] text-xl mb-2">Our Mission</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                To make premium, organic beauty accessible to every woman in Pakistan. We&apos;re committed to transparency — you&apos;ll always know exactly what goes into our products and where it comes from. No hidden ingredients, no greenwashing, no compromises.
              </p>
            </div>
          </div>
        </RevealSection>

        {/* Values */}
        <RevealSection className="mt-10">
          <h2 className="font-black text-[#8b0057] text-xl text-center mb-6">What We Stand For</h2>
          <div className="grid grid-cols-2 gap-3">
            {VALUES.map((v, i) => (
              <RevealSection key={v.title} delay={i * 80}
                className={`bg-gradient-to-br ${v.color} rounded-2xl p-4 border`}>
                <div className="text-3xl mb-2">{v.emoji}</div>
                <h3 className="font-bold text-[#8b0057] text-sm mb-1">{v.title}</h3>
                <p className="text-[11px] text-gray-500 leading-snug">{v.desc}</p>
              </RevealSection>
            ))}
          </div>
        </RevealSection>

        {/* Our story timeline */}
        <RevealSection className="mt-12">
          <h2 className="font-black text-[#8b0057] text-xl text-center mb-8">Our Journey 🗺️</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#e91e8c] to-pink-100" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <RevealSection key={m.year} delay={i * 100} className="flex gap-4 pl-2">
                  {/* Dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8b0057] to-[#e91e8c] flex items-center justify-center shadow-md z-10 relative">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 flex-1 shadow-sm border border-pink-50 -mt-0.5">
                    <span className="text-[10px] font-black text-[#e91e8c] bg-pink-50 px-2 py-0.5 rounded-full">{m.year}</span>
                    <h3 className="font-bold text-[#8b0057] text-sm mt-1.5 mb-1">{m.title}</h3>
                    <p className="text-[12px] text-gray-500 leading-snug">{m.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* Stats */}
        <RevealSection className="mt-12">
          <div className="grid grid-cols-3 gap-3">
            {[
              { num: "500+", label: "Happy Customers", emoji: "😊" },
              { num: "4", label: "Hero Products", emoji: "✨" },
              { num: "100%", label: "Organic", emoji: "🌿" },
            ].map((s, i) => (
              <RevealSection key={s.label} delay={i * 100}
                className="bg-white rounded-2xl p-4 text-center shadow-sm border border-pink-50">
                <div className="text-2xl mb-1">{s.emoji}</div>
                <p className="font-black text-[#e91e8c] text-xl">{s.num}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{s.label}</p>
              </RevealSection>
            ))}
          </div>
        </RevealSection>

        {/* Team */}
        <RevealSection className="mt-12">
          <h2 className="font-black text-[#8b0057] text-xl text-center mb-6">Meet the Team 💕</h2>
          <div className="space-y-3">
            {TEAM.map((t, i) => (
              <RevealSection key={t.name} delay={i * 80}
                className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-pink-50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                  {t.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-[#8b0057] text-sm">{t.name}</h3>
                  <p className="text-[11px] text-[#e91e8c] font-semibold">{t.role}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </RevealSection>

        {/* Ingredients promise */}
        <RevealSection className="mt-10 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100">
          <div className="flex items-center gap-2 mb-3">
            <Leaf size={18} className="text-green-600" />
            <h3 className="font-black text-green-800 text-base">Our Ingredient Promise</h3>
          </div>
          <p className="text-sm text-green-700 leading-relaxed mb-4">
            We only use ingredients that are safe, sustainably sourced, and genuinely effective. Our formulations are developed and tested in Pakistan — designed specifically for our climate and skin types.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {["No Parabens", "No Sulphates", "No Artificial Fragrance", "No Mineral Oils", "No Bleaching Agents", "No Animal Testing"].map(claim => (
              <div key={claim} className="flex items-center gap-2 text-[11px] font-semibold text-green-700">
                <div className="w-4 h-4 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px]">✓</span>
                </div>
                {claim}
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Trust badges */}
        <RevealSection className="mt-10">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Shield size={20} className="text-[#e91e8c]" />, title: "100% Organic", sub: "Certified ingredients" },
              { icon: <Star size={20} className="text-amber-500" />, title: "5-Star Rated", sub: "500+ reviews" },
              { icon: <Package size={20} className="text-[#e91e8c]" />, title: "COD Delivery", sub: "Pakistan-wide" },
            ].map(b => (
              <div key={b.title} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-pink-50">
                <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-2">
                  {b.icon}
                </div>
                <p className="font-bold text-[#8b0057] text-xs">{b.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{b.sub}</p>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* CTA */}
        <RevealSection className="mt-10 hero-animated rounded-3xl p-8 text-white text-center shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-4xl mb-3 animate-float">🐝</div>
            <h3 className="font-black text-xl mb-2">Ready to Glow?</h3>
            <p className="text-white/80 text-sm mb-5">Shop our full range of organic beauty products with COD delivery anywhere in Pakistan.</p>
            <Link href="/shop"
              className="inline-flex items-center gap-2 bg-white text-[#8b0057] font-black px-7 py-3 rounded-full text-sm shadow-lg hover:scale-105 transition-transform">
              Shop Now <ArrowRight size={14} />
            </Link>
          </div>
        </RevealSection>

        {/* Contact snippet */}
        <RevealSection className="mt-8 bg-white rounded-2xl p-5 shadow-sm border border-pink-50 text-center">
          <Heart size={18} className="text-[#e91e8c] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#8b0057] mb-1">Have Questions?</p>
          <p className="text-xs text-gray-500 mb-3">We&apos;d love to hear from you! Reach out on WhatsApp or Instagram.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/faq" className="text-xs font-semibold text-[#e91e8c] border border-pink-200 rounded-full px-4 py-2 hover:bg-pink-50 transition-colors">
              Read Our FAQs
            </Link>
          </div>
        </RevealSection>

      </div>
    </div>
  );
}
