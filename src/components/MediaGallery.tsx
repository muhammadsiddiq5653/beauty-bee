"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { MediaItem } from "@/types";

interface Props {
  media: MediaItem[];
  fallbackEmoji?: string;
  fallbackImageUrl?: string;
  alt: string;
}

export default function MediaGallery({ media, fallbackEmoji, fallbackImageUrl, alt }: Props) {
  const [active, setActive] = useState(0);

  // Build the list: prefer media array, fall back to single imageUrl, then emoji
  const items: MediaItem[] = media.length > 0
    ? media
    : fallbackImageUrl
      ? [{ type: "image", url: fallbackImageUrl }]
      : [];

  if (items.length === 0) {
    return (
      <div className="relative bg-[#F2EDE8] h-72 flex items-center justify-center">
        <span className="text-9xl">{fallbackEmoji}</span>
      </div>
    );
  }

  const current = items[active];

  function prev() { setActive(i => (i - 1 + items.length) % items.length); }
  function next() { setActive(i => (i + 1) % items.length); }

  return (
    <div className="relative bg-[#F2EDE8] select-none">
      {/* Main viewer */}
      <div className="relative h-72 overflow-hidden">
        {current.type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <Image src={current.url} alt={alt} fill className="object-cover" />
        )}

        {/* Nav arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? "bg-white w-4" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto bg-white border-t border-[#EDE8E4]" style={{ scrollbarWidth: "none" }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === active ? "border-[#9B2B47]" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              {item.type === "video" ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Play size={18} className="text-white" fill="white" />
                </div>
              ) : (
                <Image src={item.url} alt={`${alt} ${i + 1}`} fill className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
