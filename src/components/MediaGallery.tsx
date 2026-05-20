"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { MediaItem, Shade } from "@/types";

interface Props {
  media: MediaItem[];
  fallbackEmoji?: string;
  fallbackImageUrl?: string;
  alt: string;
  shades?: Shade[];
  selectedShade?: string;
}

export default function MediaGallery({ media, fallbackEmoji, fallbackImageUrl, alt, shades, selectedShade }: Props) {
  const [active, setActive] = useState(0);
  const [cycleIndex, setCycleIndex] = useState(0);

  // Build base items list
  const items: MediaItem[] = media.length > 0
    ? media
    : fallbackImageUrl
      ? [{ type: "image", url: fallbackImageUrl }]
      : [];

  // Shade images that exist
  const shadeImages = (shades ?? []).filter(s => s.imageUrl);

  // When a shade is selected, override the displayed image
  const selectedShadeImage = selectedShade
    ? shades?.find(s => s.name === selectedShade)?.imageUrl
    : null;

  // Auto-cycle through shade images when no shade is selected
  useEffect(() => {
    if (selectedShade || shadeImages.length < 2) return;
    const interval = setInterval(() => {
      setCycleIndex(i => (i + 1) % shadeImages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [selectedShade, shadeImages.length]);

  // Showing shade override — bypass normal gallery
  if (selectedShadeImage || (!selectedShade && shadeImages.length > 0 && items.length === 0)) {
    const url = selectedShadeImage ?? shadeImages[cycleIndex].imageUrl!;
    return (
      <div className="relative bg-[#F2EDE8] select-none">
        <div className="relative h-72 overflow-hidden">
          <Image
            key={url}
            src={url}
            alt={selectedShade ?? alt}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover transition-opacity duration-500"
          />
          {!selectedShade && shadeImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {shadeImages.map((s, i) => (
                <span
                  key={i}
                  className={`block rounded-full transition-all duration-300 ${i === cycleIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          )}
          {!selectedShade && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
              Select a shade to see its colour
            </div>
          )}
        </div>
        {/* Shade thumbnail strip */}
        {shadeImages.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-white border-t border-[#EDE8E4]" style={{ scrollbarWidth: "none" }}>
            {shadeImages.map((s, i) => (
              <div
                key={i}
                className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedShade === s.name ? "border-[#9B2B47]" :
                  (!selectedShade && i === cycleIndex) ? "border-[#9B2B47]/50" :
                  "border-transparent opacity-60"
                }`}
              >
                <Image src={s.imageUrl!} alt={s.name} fill sizes="56px" className="object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] text-center py-0.5 truncate px-1">{s.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Normal gallery (no shade images or shade image selected alongside gallery items)
  if (items.length === 0) {
    // Emoji fallback with shade cycling if shade images exist
    return (
      <div className="relative bg-[#F2EDE8] h-72 flex items-center justify-center">
        <span className="text-9xl">{fallbackEmoji}</span>
      </div>
    );
  }

  // When a shade with an image is selected, show it as the active item on top of gallery
  const displayItems: MediaItem[] = selectedShadeImage
    ? [{ type: "image", url: selectedShadeImage }, ...items]
    : items;

  const activeIndex = selectedShadeImage ? 0 : active;
  const current = displayItems[activeIndex];

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
          <Image key={current.url} src={current.url} alt={alt} fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover transition-opacity duration-300" />
        )}

        {/* Nav arrows — only for base gallery items */}
        {!selectedShadeImage && items.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {!selectedShadeImage && items.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? "bg-white w-4" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {(items.length > 1 || shadeImages.length > 0) && (
        <div className="flex gap-2 p-3 overflow-x-auto bg-white border-t border-[#EDE8E4]" style={{ scrollbarWidth: "none" }}>
          {/* Shade thumbnails first */}
          {shadeImages.map((s, i) => (
            <div key={`shade-${i}`}
              className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${selectedShade === s.name ? "border-[#9B2B47]" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <Image src={s.imageUrl!} alt={s.name} fill sizes="56px" className="object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] text-center py-0.5 truncate px-1">{s.name}</div>
            </div>
          ))}
          {/* Gallery thumbnails */}
          {items.map((item, i) => (
            <button key={`media-${i}`} onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${!selectedShadeImage && i === active ? "border-[#9B2B47]" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              {item.type === "video" ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Play size={18} className="text-white" fill="white" />
                </div>
              ) : (
                <Image src={item.url} alt={`${alt} ${i + 1}`} fill sizes="56px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
