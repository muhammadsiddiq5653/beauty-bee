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
    text: "I've tried so many tints but nothing compares to this. It blends like a dream on both lips and cheeks. The Rose Nude shade is everything — subtle but gorgeous. Fast delivery too!",
    product: "Lip & Cheek Tint — Rose Nude",
    verified: true,
  },
  {
    id: "r3",
    name: "Ayesha K.",
    city: "Islamabad",
    avatar: "A",
    rating: 5,
    date: "3 days ago",
    text: "Ordered 2 shades and I use them every single day now. The Berry shade is perfect for evening looks and the Coral for daytime. All organic and my skin hasn't broken out at all!",
    product: "Lip & Cheek Tint — Berry",
    verified: true,
  },
  {
    id: "r4",
    name: "Hina R.",
    city: "Faisalabad",
    avatar: "H",
    rating: 5,
    date: "2 weeks ago",
    text: "My friends keep asking what I'm wearing on my cheeks — it gives the most natural flush. Light enough to build up or wear sheer. Absolutely obsessed with this tint!",
    product: "Lip & Cheek Tint — Peach",
    verified: true,
  },
  {
    id: "r5",
    name: "Zara N.",
    city: "Rawalpindi",
    avatar: "Z",
    rating: 5,
    date: "5 days ago",
    text: "Finally a Pakistani organic brand I can trust. No irritation, no artificial smell. Just beautiful colour that stays put. I've gifted the Shade Duo to three friends already.",
    product: "Lip & Cheek Tint — Shade Duo",
    verified: true,
  },
  {
    id: "r6",
    name: "Maham T.",
    city: "Multan",
    avatar: "M",
    rating: 5,
    date: "1 week ago",
    text: "COD made it so easy to order without any stress. Arrived in 3 days perfectly packaged. The tint itself is beautiful — light, buildable, and completely natural feeling on the skin.",
    product: "Lip & Cheek Tint — Coral",
    verified: true,
  },
  {
    id: "r7",
    name: "Nimra B.",
    city: "Peshawar",
    avatar: "N",
    rating: 5,
    date: "4 days ago",
    text: "I was sceptical at first but this tint is genuinely incredible. The Rose Nude shade makes me look like I have naturally flushed cheeks. I get compliments every time I wear it.",
    product: "Lip & Cheek Tint — Rose Nude",
    verified: true,
  },
  {
    id: "r8",
    name: "Urooj S.",
    city: "Sialkot",
    avatar: "U",
    rating: 5,
    date: "6 days ago",
    text: "Gorgeous product. Stays on through a full day of work, doesn't fade or look patchy. The formula is so smooth and I love that it's 100% organic. Reordering every month now!",
    product: "Lip & Cheek Tint — Berry",
    verified: true,
  },
  {
    id: "r9",
    name: "Maryam F.",
    city: "Hyderabad",
    avatar: "M",
    rating: 5,
    date: "3 weeks ago",
    text: "The packaging is so cute and the colour payoff is amazing. I only need one layer for a natural look or two for something more bold. Totally worth every rupee!",
    product: "Lip & Cheek Tint — Peach",
    verified: true,
  },
  {
    id: "r10",
    name: "Sadaf Q.",
    city: "Quetta",
    avatar: "S",
    rating: 4,
    date: "2 weeks ago",
    text: "Really happy with this purchase. The tint is so easy to apply and the colour is exactly as shown. Shipping was quick and the COD was convenient. Would definitely buy again.",
    product: "Lip & Cheek Tint — Coral",
    verified: true,
  },
  {
    id: "r11",
    name: "Alina Z.",
    city: "Lahore",
    avatar: "A",
    rating: 5,
    date: "1 day ago",
    text: "Stumbled on Beauty Bee on Instagram and took a chance — so glad I did! The Berry shade is rich and stunning. My skin feels nourished, not dried out like other tints. Pure quality.",
    product: "Lip & Cheek Tint — Berry",
    verified: true,
  },
  {
    id: "r12",
    name: "Rabia H.",
    city: "Karachi",
    avatar: "R",
    rating: 5,
    date: "5 days ago",
    text: "Bought the Shade Duo bundle and it's such good value. Both shades are stunning and I love switching between them. The formula is incredibly lightweight — you almost forget you're wearing it.",
    product: "Lip & Cheek Tint — Shade Duo",
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
          className={s <= rating ? "fill-[#C9A84C] text-[#C9A84C]" : "text-[#EDE8E4] fill-[#EDE8E4]"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, visible, delay }: { review: Review; visible: boolean; delay: number }) {
  return (
    <div
      className="bg-white rounded-3xl p-5 border border-[#EDE8E4] flex-shrink-0 w-72 transition-all duration-500 hover:shadow-md hover:-translate-y-1"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <Quote size={16} className="text-[#EDE8E4] mb-2" />
      <StarRating rating={review.rating} />
      <p className="text-[#6B6B6B] text-xs leading-relaxed mt-2 mb-3 line-clamp-4">
        &quot;{review.text}&quot;
      </p>
      <div className="text-[10px] bg-[#F9ECF0] text-[#9B2B47] px-2.5 py-1 rounded-full font-medium inline-block mb-3">
        {review.product}
      </div>
      <div className="flex items-center gap-2 border-t border-[#EDE8E4] pt-3">
        <div className="w-8 h-8 rounded-full bg-[#9B2B47] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {review.avatar}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#1A1A1A] text-xs">{review.name}</span>
            {review.verified && (
              <span className="text-[9px] bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">✓ Verified</span>
            )}
          </div>
          <span className="text-[10px] text-[#6B6B6B]">{review.city} · {review.date}</span>
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

  const reviews = productId
    ? ALL_REVIEWS.filter(r => r.product.toLowerCase().includes(productId.toLowerCase())).length > 0
      ? ALL_REVIEWS.filter(r => r.product.toLowerCase().includes(productId.toLowerCase()))
      : ALL_REVIEWS.slice(0, 4)
    : ALL_REVIEWS;

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

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -290, behavior: "smooth" });
  }
  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 290, behavior: "smooth" });
  }

  return (
    <div ref={sectionRef}>
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#EDE8E4] p-6 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="text-center flex-shrink-0">
            <div className="font-serif font-bold text-4xl text-[#1A1A1A]">4.9</div>
            <StarRating rating={5} size={12} />
            <div className="text-[10px] text-[#6B6B6B] mt-0.5">out of 5</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const displayPct = star === 5 ? 91 : star === 4 ? 7 : star === 3 ? 1 : star === 2 ? 1 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6B6B6B] w-3">{star}</span>
                  <Star size={9} className="fill-[#C9A84C] text-[#C9A84C] flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-[#F2EDE8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C9A84C] rounded-full transition-all duration-1000"
                      style={{ width: visible ? `${displayPct}%` : "0%" }}
                    />
                  </div>
                  <span className="text-[10px] text-[#6B6B6B] w-6">{displayPct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="font-serif font-bold text-xl text-[#9B2B47]">2,500+</p>
          <p className="text-xs text-[#6B6B6B]">verified reviews</p>
          <div className="hidden sm:flex gap-2 mt-3 justify-end">
            <button onClick={scrollLeft}
              className="w-8 h-8 rounded-full bg-[#FAF7F4] border border-[#EDE8E4] flex items-center justify-center text-[#9B2B47] hover:bg-[#F9ECF0] transition-colors">
              <ChevronLeft size={15} />
            </button>
            <button onClick={scrollRight}
              className="w-8 h-8 rounded-full bg-[#FAF7F4] border border-[#EDE8E4] flex items-center justify-center text-[#9B2B47] hover:bg-[#F9ECF0] transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable review cards */}
      <div
        ref={scrollRef}
        onScroll={() => setScrollPos(scrollRef.current?.scrollLeft ?? 0)}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory"
      >
        {reviews.map((review, i) => (
          <div key={review.id} className="snap-start">
            <ReviewCard review={review} visible={visible} delay={i * 60} />
          </div>
        ))}
      </div>

      {/* Mobile dots */}
      <div className="flex justify-center gap-1.5 mt-3 sm:hidden">
        {reviews.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              Math.round(scrollPos / 290) === i ? "w-4 bg-[#9B2B47]" : "w-1.5 bg-[#EDE8E4]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
