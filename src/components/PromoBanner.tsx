"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BannerSlide {
  id: string;
  badge?: string;
  headline: string;
  subline: string;
  cta: string;
  ctaHref: string;
  emoji: string;
  floatingEmojis: string[];
  gradient: string;
  accentColor: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: "sale",
    badge: "LIMITED TIME",
    headline: "Up to 25% OFF",
    subline: "On all skincare bundles — Cash on Delivery, delivered Pakistan-wide",
    cta: "Shop Bundles",
    ctaHref: "/shop#products",
    emoji: "💝",
    floatingEmojis: ["✨", "💕", "🌸", "⭐"],
    gradient: "from-[#6a0040] via-[#8b0057] to-[#e91e8c]",
    accentColor: "text-yellow-300",
  },
  {
    id: "tint",
    badge: "BESTSELLER",
    headline: "Lip & Cheek Tint",
    subline: "4 gorgeous shades · Long-lasting · 100% organic formula",
    cta: "Shop Now — Rs. 450",
    ctaHref: "/product/tint",
    emoji: "💋",
    floatingEmojis: ["💄", "🌺", "💗", "✨"],
    gradient: "from-[#880e4f] via-[#c2185b] to-[#f06292]",
    accentColor: "text-pink-200",
  },
  {
    id: "glow",
    badge: "NEW BUNDLE",
    headline: "Complete Glow Set",
    subline: "Tint + Serum + Whitening Mask + Soap — your full routine in one order",
    cta: "Get the Set — Rs. 1,999",
    ctaHref: "/shop#products",
    emoji: "👑",
    floatingEmojis: ["🌟", "💫", "✨", "🌸"],
    gradient: "from-[#4a148c] via-[#7b1fa2] to-[#e91e8c]",
    accentColor: "text-purple-200",
  },
  {
    id: "organic",
    badge: "100% ORGANIC",
    headline: "Pure. Natural. Beautiful.",
    subline: "No harsh chemicals · No parabens · Just pure organic ingredients for your skin",
    cta: "Explore Products",
    ctaHref: "/shop",
    emoji: "🌿",
    floatingEmojis: ["🌿", "🍃", "🌺", "✨"],
    gradient: "from-[#1b5e20] via-[#2e7d32] to-[#e91e8c]",
    accentColor: "text-green-200",
  },
];

function FloatingEmoji({ emoji, index }: { emoji: string; index: number }) {
  return (
    <div
      className="absolute text-2xl opacity-20 pointer-events-none select-none"
      style={{
        left: `${8 + index * 22}%`,
        top: `${15 + (index % 2) * 45}%`,
        animation: `float ${3 + index * 0.6}s ease-in-out infinite`,
        animationDelay: `${index * 0.5}s`,
      }}
    >
      {emoji}
    </div>
  );
}

export default function PromoBanner() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number, dir: "left" | "right" = "right") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 350);
  }, [animating]);

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, "right");
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, "left");
  }, [current, goTo]);

  // Auto-advance
  useEffect(() => {
    intervalRef.current = setInterval(next, 4500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [next]);

  // Pause on hover
  const pause = () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  const resume = () => { intervalRef.current = setInterval(next, 4500); };

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    setTouchStart(null);
  };

  const slide = SLIDES[current];

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-xl mx-0"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide */}
      <div
        className={`bg-gradient-to-r ${slide.gradient} text-white transition-all duration-350 ease-out`}
        style={{
          transform: animating
            ? `translateX(${direction === "right" ? "-8%" : "8%"})`
            : "translateX(0)",
          opacity: animating ? 0 : 1,
          transition: "transform 0.35s ease-out, opacity 0.35s ease-out",
        }}
      >
        {/* Floating bg emojis */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {slide.floatingEmojis.map((e, i) => (
            <FloatingEmoji key={i} emoji={e} index={i} />
          ))}
          {/* Glow circle */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative z-10 px-5 py-7 flex items-center gap-4">
          {/* Emoji hero */}
          <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center">
            <span
              className="text-6xl drop-shadow-lg"
              style={{ animation: "float 3s ease-in-out infinite" }}
            >
              {slide.emoji}
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            {slide.badge && (
              <span className="inline-block text-[10px] font-black tracking-widest bg-white/20 border border-white/30 rounded-full px-2.5 py-0.5 mb-2 backdrop-blur-sm">
                {slide.badge}
              </span>
            )}
            <h3 className={`text-xl font-black leading-tight mb-1 ${slide.accentColor}`}>
              {slide.headline}
            </h3>
            <p className="text-white/80 text-xs leading-snug mb-3 line-clamp-2">
              {slide.subline}
            </p>
            <Link
              href={slide.ctaHref}
              className="btn-ripple inline-flex items-center gap-1.5 bg-white text-[#8b0057] font-black text-xs px-4 py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              {slide.cta} →
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 z-20"
      >
        <ChevronLeft size={14} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 z-20"
      >
        <ChevronRight size={14} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? "right" : "left")}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-5 h-2 bg-white shadow"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
        <div
          key={current}
          className="h-full bg-white/60 rounded-full"
          style={{ animation: "progress-bar 4.5s linear forwards" }}
        />
      </div>
    </div>
  );
}
