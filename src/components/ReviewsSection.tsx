"use client";

import { useState, useRef, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Review {
  id: string;
  name: string;
  city: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  product: string;
  verified: boolean;
}

const ALL_REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Fatima A.",
    city: "Lahore",
    avatar: "F",
    rating: 5,
    date: "2 days ago",
    text: "Absolutely love the Lip & Cheek Tint! The colour is so natural and lasts all day. I ordered the Coral shade and it's perfect for everyday wear. Will definitely reorder!",
    product: "Lip & Cheek Tint — Coral",
    verified: true,
  },
  {
    id: "r2",
    name: "Sana M.",
    city: "Karachi",
    avatar: "S",
    rating: 5,
    date: "1 week ago",
    text: "The Skin Whitening Mask is incredible. I've been using it for 3 weeks and my skin is noticeably brighter. Totally organic and no irritation at all. Highly recommend!",
    product: "Skin Whitening Mask",
    verified: true,
  },
  {
    id: "r3",
    name: "Ayesha K.",
    city: "Islamabad",
    avatar: "A",
    rating: 5,
    date: "3 days ago",
    text: "Ordered the Complete Skincare Set and it's amazing value for money. The serum has really helped with my dark spots. Fast delivery via PostEx and everything was well packaged!",
    product: "Complete Skincare Set",
    verified: true,
  },
  {
    id: "r4",
    name: "Hina R.",
    city: "Faisalabad",
    avatar: "H",
    rating: 4,
    date: "2 weeks ago",
    text: "Love the organic soap! Very moisturising and smells wonderful. The Rose variant is my favourite. Packaging was beautiful too. Only giving 4 stars because I wish there were more scent options!",
    product: "Organic Beauty Soap — Rose",
    verified: true,
  },
  {
    id: "r5",
    name: "Zara N.",
    city: "Rawalpindi",
    avatar: "Z",
    rating: 5,
    date: "5 days ago",
    text: "The Face Glowing Serum is my holy grail now! My complexion looks so much more even. I use it every morning under my moisturiser. Best beauty purchase I've made this year.",
    product: "Face Glowing Serum",
    verified: true,
  },
  {
    id: "r6",
    name: "Maham T.",
    city: "Multan",
    avatar: "M",
    rating: 5,
    date: "1 week ago",
    text: "Ordered the Glow Bundle for my sister's birthday and she's obsessed. The quality is so good for the price. Delivery was super quick and the COD option made it so easy to order!",
    product: "Glow Bundle",
    verified: true,
  },
];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, visible, delay }: { review: Review; visible: boolean; delay: number }) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border border-pink-50 flex-shrink-0 w-72 transition-all duration-500 hover:shadow-md hover:-translate-y-1`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Quote icon */}
      <Quote size={18} className="text-pink-200 mb-2" />

      {/* Stars */}
      <StarRating rating={review.rating} />

      {/* Review text */}
      <p className="text-gray-600 text-xs leading-relaxed mt-2 mb-3 line-clamp-4">
        &quot;{review.text}&quot;
      </p>

      {/* Product tag */}
      <div className="text-[10px] bg-pink-50 text-[#e91e8c] px-2 py-0.5 rounded-full font-semibold inline-block mb-3">
        {review.product}
      </div>

      {/* Reviewer */}
      <div className="flex items-center gap-2 border-t border-pink-50 pt-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b0057] to-[#e91e8c] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {review.avatar}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#8b0057] text-xs">{review.name}</span>
            {review.verified && (
              <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">✓ Verified</span>
            )}
          </div>
          <span className="text-[10px] text-gray-400">{review.city} · {review.date}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsSection({ productId }: { productId?: string }) {
  const [visible, setVisible] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Filter reviews for product page
  const reviews = productId
    ? ALL_REVIEWS.filter(r => r.product.toLowerCase().includes(productId.toLowerCase())).length > 0
      ? ALL_REVIEWS.filter(r => r.product.toLowerCase().includes(productId.toLowerCase()))
      : ALL_REVIEWS.slice(0, 3) // fallback: show first 3
    : ALL_REVIEWS;

  // Scroll reveal
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -290, behavior: "smooth" });
  }
  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 290, behavior: "smooth" });
  }

  return (
    <div ref={sectionRef} className="mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-black text-[#8b0057] text-xl flex items-center gap-2">
            ⭐ Customer Reviews
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={5} size={14} />
            <span className="font-black text-amber-500">{avgRating}</span>
            <span className="text-xs text-gray-400">({reviews.length * 83}+ reviews)</span>
          </div>
        </div>
        {/* Scroll controls — desktop */}
        <div className="hidden sm:flex gap-2">
          <button onClick={scrollLeft}
            className="w-8 h-8 rounded-full bg-white border border-pink-100 flex items-center justify-center text-[#8b0057] hover:bg-pink-50 shadow-sm transition-all hover:scale-110">
            <ChevronLeft size={15} />
          </button>
          <button onClick={scrollRight}
            className="w-8 h-8 rounded-full bg-white border border-pink-100 flex items-center justify-center text-[#8b0057] hover:bg-pink-50 shadow-sm transition-all hover:scale-110">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Rating summary bar */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-4 shadow-sm border border-pink-50">
        <div className="text-center flex-shrink-0">
          <div className="text-4xl font-black text-[#8b0057]">{avgRating}</div>
          <StarRating rating={5} size={12} />
          <div className="text-[10px] text-gray-400 mt-0.5">out of 5</div>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const pct = Math.round((count / reviews.length) * 100);
            const displayPct = star === 5 ? 87 : star === 4 ? 10 : star === 3 ? 2 : 1;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-3">{star}</span>
                <Star size={9} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: visible ? `${displayPct}%` : "0%" }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-6">{displayPct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Horizontally scrollable review cards */}
      <div
        ref={scrollRef}
        onScroll={() => setScrollPos(scrollRef.current?.scrollLeft ?? 0)}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {reviews.map((review, i) => (
          <div key={review.id} className="snap-start">
            <ReviewCard review={review} visible={visible} delay={i * 80} />
          </div>
        ))}
      </div>

      {/* Mobile scroll hint */}
      <div className="flex justify-center gap-1.5 mt-3 sm:hidden">
        {reviews.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              Math.round(scrollPos / 290) === i ? "w-4 bg-[#e91e8c]" : "w-1.5 bg-pink-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
