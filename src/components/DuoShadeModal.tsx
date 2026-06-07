"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBag, X } from "lucide-react";
import type { Bundle, Shade } from "@/types";

const SLOT_LABELS = ["First Tint", "Second Tint", "Third Tint"];

interface Props {
  bundle: Bundle;
  shadeOptions: Shade[];
  shadeSlotCount: number;
  onClose: () => void;
  onConfirm: (shadeLabel: string) => void;
}

export default function DuoShadeModal({ bundle, shadeOptions, shadeSlotCount, onClose, onConfirm }: Props) {
  const [selectedShades, setSelectedShades] = useState<string[]>([]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [poppedShade, setPoppedShade] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  const filled = selectedShades.filter(Boolean).length;
  const shadesComplete = filled === shadeSlotCount;
  const shadeLabel = selectedShades.filter(Boolean).join(" + ");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function pick(shadeName: string) {
    const updated = [...selectedShades];
    updated[activeSlot] = shadeName;
    setSelectedShades(updated);
    setPoppedShade(shadeName);
    setTimeout(() => setPoppedShade(null), 350);
    const next = Array.from({ length: shadeSlotCount }, (_, i) => i)
      .find(i => i !== activeSlot && !updated[i]);
    if (next !== undefined) setTimeout(() => setActiveSlot(next), 120);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(15,5,10,0.52)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg animate-sheet-up rounded-t-[32px] bg-[var(--bb-cream)] shadow-[0_-8px_48px_rgba(0,0,0,0.22)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-4 pb-1">
          <div className="h-[5px] w-10 rounded-full bg-black/[0.1]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-3 pb-2">
          <div>
            <h2 className="bb-serif text-[26px] leading-none text-[var(--bb-ink)]">Pick Your Shades</h2>
            <p className="mt-0.5 text-xs font-bold text-[var(--bb-ink-soft)]">{bundle.name}</p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-black/[0.07] hover:bg-black/[0.11] transition-colors"
          >
            <X size={14} className="text-[var(--bb-ink-soft)]" />
          </button>
        </div>

        {/* Slot indicators */}
        <div className="flex items-center justify-center gap-8 px-6 pt-5 pb-1">
          {Array.from({ length: shadeSlotCount }, (_, i) => {
            const sel = shadeOptions.find(s => s.name === selectedShades[i]);
            const isActive = activeSlot === i;
            return (
              <button key={i} onClick={() => setActiveSlot(i)} className="flex flex-col items-center gap-2">
                <div
                  className={`relative flex h-[66px] w-[66px] items-center justify-center rounded-full transition-all duration-300
                    ${sel ? "shadow-lg" : "border-[2.5px] border-dashed border-[rgba(155,43,71,0.3)]"}
                    ${isActive ? "ring-[3px] ring-[var(--bb-berry)] ring-offset-[3px] scale-110" : ""}
                  `}
                  style={sel ? {
                    background: sel.hex ?? "#A52647",
                    boxShadow: `0 6px 18px ${sel.hex ?? "#A52647"}55`,
                  } : {}}
                >
                  {sel
                    ? <Check size={20} strokeWidth={3} className="text-white drop-shadow-sm" />
                    : <span className="select-none text-2xl font-black text-[var(--bb-berry)] opacity-25">?</span>
                  }
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                  isActive ? "text-[var(--bb-berry)]" : "text-[var(--bb-ink-soft)]"
                }`}>
                  {SLOT_LABELS[i] ?? `Tint ${i + 1}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step label */}
        <div className="mt-4 text-center">
          <span className="inline-block rounded-full bg-[rgba(155,43,71,0.08)] px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--bb-berry)]">
            {shadesComplete ? "Your combo is ready ✓" : `Picking ${SLOT_LABELS[activeSlot] ?? `Tint ${activeSlot + 1}`}`}
          </span>
        </div>

        {/* Shade circles */}
        <div className="mt-5 grid grid-cols-3 gap-3 px-6 pb-2">
          {shadeOptions.map((shade) => {
            const slotForThis = selectedShades.findIndex(s => s === shade.name);
            const isActiveSelection = selectedShades[activeSlot] === shade.name;
            const isPopping = poppedShade === shade.name;
            return (
              <button key={shade.name} onClick={() => pick(shade.name)} className="group flex flex-col items-center gap-2.5">
                <div
                  className={`relative flex h-[80px] w-[80px] items-center justify-center rounded-full border-[4px] transition-all duration-200 active:scale-90
                    ${isPopping ? "animate-swatch-pop" : ""}
                    ${isActiveSelection
                      ? "border-[var(--bb-berry)] scale-[1.1]"
                      : "border-white hover:scale-[1.06]"
                    }
                  `}
                  style={{
                    background: shade.hex ?? "#A52647",
                    boxShadow: isActiveSelection
                      ? `0 8px 24px ${shade.hex ?? "#A52647"}60, inset 0 -3px 6px rgba(0,0,0,0.14)`
                      : "0 4px 14px rgba(0,0,0,0.15), inset 0 -3px 6px rgba(0,0,0,0.10)",
                  }}
                >
                  {isActiveSelection && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/[0.22]">
                      <Check size={28} strokeWidth={3} className="text-white" />
                    </div>
                  )}
                  {slotForThis >= 0 && !isActiveSelection && (
                    <div className="absolute -right-0.5 -top-0.5 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[var(--bb-berry)] shadow-md">
                      <span className="text-[9px] font-black text-white">{slotForThis + 1}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[11px] font-black text-center leading-tight transition-colors ${
                  isActiveSelection ? "text-[var(--bb-berry)]" : "text-[var(--bb-ink-soft)]"
                }`}>
                  {shade.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Combo strip */}
        {shadesComplete && (
          <div className="mx-6 mt-4 flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 animate-bounce-in">
            <div className="flex -space-x-2.5">
              {selectedShades.map((name, i) => {
                const s = shadeOptions.find(x => x.name === name);
                return (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white shadow-md"
                    style={{ background: s?.hex ?? "#A52647" }}
                  />
                );
              })}
            </div>
            <span className="text-sm font-black text-[var(--bb-ink)]">{shadeLabel}</span>
            <Check size={15} className="ml-auto text-green-600" strokeWidth={2.5} />
          </div>
        )}

        {/* CTA */}
        <div className="px-6 pb-8 pt-4">
          <button
            disabled={!shadesComplete}
            onClick={() => shadesComplete && onConfirm(shadeLabel)}
            className={`bb-btn bb-btn-primary w-full gap-2 transition-all ${
              !shadesComplete
                ? "cursor-not-allowed opacity-40"
                : "shadow-[0_4px_18px_rgba(155,43,71,0.32)]"
            }`}
          >
            <ShoppingBag size={16} />
            {shadesComplete
              ? `Add to Bag — Rs. ${bundle.price.toLocaleString()}`
              : `${shadeSlotCount - filled} shade${shadeSlotCount - filled !== 1 ? "s" : ""} left to pick`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
