"use client";

import { useState, useEffect } from "react";
import { X, Gift, Sparkles } from "lucide-react";

export default function EmailCapture() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show popup after 8 seconds, only if not already dismissed/subscribed
    if (localStorage.getItem("bb_email_captured")) return;
    const timer = setTimeout(() => setOpen(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setOpen(false);
    // Re-show after 3 days if not subscribed
    setTimeout(() => {
      if (!localStorage.getItem("bb_email_captured")) setOpen(true);
    }, 1000 * 60 * 60 * 24 * 3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // fail silently — still mark as captured
    }
    localStorage.setItem("bb_email_captured", "1");
    setSubmitted(true);
    setLoading(false);
    setTimeout(() => setOpen(false), 3000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#9B2B47] via-[#D4627A] to-[#C9A84C]" />

        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="p-8 text-center">
          {submitted ? (
            <div className="py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F9ECF0] rounded-full mb-4">
                <Sparkles size={24} className="text-[#9B2B47]" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#1A1A1A] mb-2">You&apos;re In!</h3>
              <p className="text-[#6B6B6B] text-sm">Check your inbox for your exclusive discount.</p>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F9ECF0] rounded-full mb-4">
                <Gift size={24} className="text-[#9B2B47]" />
              </div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#9B2B47]/70 mb-1">
                Exclusive Offer
              </p>
              <h3 className="font-serif font-bold text-2xl text-[#1A1A1A] mb-2">
                Get 10% Off Your First Order
              </h3>
              <p className="text-[#6B6B6B] text-sm mb-6">
                Join 2,000+ Beauty Bee girls. Get skincare tips, new shade alerts & exclusive deals.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-[#EDE8E4] rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[#9B2B47] transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#9B2B47] text-white font-semibold py-3 rounded-full text-sm hover:bg-[#7d2239] transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Claim My 10% Off"}
                </button>
              </form>

              <p className="text-[10px] text-[#9B9B9B] mt-4">
                No spam, ever. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
