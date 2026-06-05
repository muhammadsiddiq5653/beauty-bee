"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Heart, Leaf, Package, Shield, Sparkles, Star } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import StoreNav from "@/components/StoreNav";
import WhatsAppButton from "@/components/WhatsAppButton";

const VALUES = [
  { icon: <Leaf size={22} />, title: "Organic first", desc: "Gentle formulas built around naturally derived ingredients and everyday comfort." },
  { icon: <Sparkles size={22} />, title: "Made for glow", desc: "Color and skincare rituals that work for Pakistani weather, routines, and skin tones." },
  { icon: <Heart size={22} />, title: "Community loved", desc: "Customer feedback shapes shades, bundles, delivery, and every little detail." },
  { icon: <Shield size={22} />, title: "Honest beauty", desc: "Clear product information, COD checkout, and tracked delivery through PostEx." },
];

const MILESTONES = [
  ["2021", "The beginning", "Beauty Bee started with small-batch organic beauty experiments and a love for easy everyday glow."],
  ["2022", "Going online", "Instagram orders grew quickly as customers shared their favorite tint shades."],
  ["2024", "Nationwide delivery", "PostEx delivery and COD made Beauty Bee available across Pakistan."],
  ["2026", "A new store", "The app now brings the full tint experience, bundles, checkout, and tracking into one place."],
];

function Mesh() {
  return <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>;
}

export default function AboutPage() {
  return (
    <div className="bb-page">
      <Mesh />
      <StoreNav />
      <CartDrawer />
      <WhatsAppButton />

      <main className="bb-shell px-5 py-8 pb-16">
        <section className="bb-section-head">
          <Image src="/logo.svg" alt="Beauty Bee" width={148} height={60} priority unoptimized />
          <span className="bb-eyebrow">Our Story</span>
          <h1 className="bb-section-title">Beauty that<br /><em>feels alive.</em></h1>
          <p className="bb-section-sub">
            Beauty Bee makes organic-inspired beauty feel simple, wearable, and joyful for everyday routines.
          </p>
        </section>

        <section className="bb-glass rounded-[28px] p-7">
          <span className="bb-eyebrow">Mission</span>
          <h2 className="bb-serif mt-3 text-4xl leading-none text-[var(--bb-ink)]">Premium beauty, without the fuss.</h2>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">
            We believe beauty should be easy to trust and easy to wear. Our products are created for women who want color, care, and convenience without complicated routines or hidden surprises.
          </p>
        </section>

        <section className="bb-section px-0">
          <div className="bb-section-head">
            <span className="bb-eyebrow">What We Stand For</span>
            <h2 className="bb-section-title">The Beauty Bee<br /><em>promise.</em></h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {VALUES.map(value => (
              <article key={value.title} className="bb-glass rounded-[22px] p-4">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-[rgba(155,43,71,0.08)] text-[var(--bb-berry)]">{value.icon}</span>
                <h3 className="bb-serif text-2xl leading-none">{value.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--bb-ink-soft)]">{value.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bb-section px-0">
          <div className="bb-section-head">
            <span className="bb-eyebrow">Journey</span>
            <h2 className="bb-section-title">From shade tests<br /><em>to your shelf.</em></h2>
          </div>
          <div className="relative grid gap-4">
            {MILESTONES.map(([year, title, desc]) => (
              <article key={year} className="bb-glass rounded-[22px] p-5">
                <span className="rounded-full bg-[var(--bb-berry)] px-3 py-1 text-xs font-black text-white">{year}</span>
                <h3 className="bb-serif mt-3 text-3xl leading-none">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--bb-ink-soft)]">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bb-glass rounded-[28px] p-7">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: <Star size={22} />, num: "4.8", label: "average rating" },
              { icon: <Package size={22} />, num: "COD", label: "Pakistan-wide" },
              { icon: <Check size={22} />, num: "500+", label: "happy reviews" },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl bg-white/55 p-3">
                <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-[rgba(155,43,71,0.08)] text-[var(--bb-berry)]">{stat.icon}</span>
                <p className="bb-serif text-2xl leading-none text-[var(--bb-berry)]">{stat.num}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-[var(--bb-ink-soft)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] bg-[var(--bb-ink)] p-8 text-center text-white">
          <Image src="/logo.svg" alt="Beauty Bee" width={120} height={48} className="mx-auto brightness-0 invert opacity-80" />
          <h2 className="bb-serif mt-5 text-4xl leading-none">Ready to glow?</h2>
          <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-relaxed text-white/65">
            Shop the tint-led Beauty Bee experience with local checkout and tracked delivery.
          </p>
          <Link href="/shop" className="bb-btn mt-6 bg-white text-[var(--bb-berry)]">
            Shop now <ArrowRight size={17} />
          </Link>
        </section>
      </main>
    </div>
  );
}
