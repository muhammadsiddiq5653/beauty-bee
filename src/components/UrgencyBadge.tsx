"use client";

import { useState, useEffect } from "react";
import { Flame, Eye, Clock } from "lucide-react";

interface Props {
  productId: string;
  stock?: number;
  compact?: boolean; // smaller version for product cards
}

// Seeded random — consistent per product but varies per product
function seededRand(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const norm = ((h >>> 0) % 1000) / 1000;
  return Math.floor(min + norm * (max - min + 1));
}

export default function UrgencyBadge({ productId, stock, compact = false }: Props) {
  const [viewers, setViewers] = useState(0);
  const [recentOrders, setRecentOrders] = useState(0);

  useEffect(() => {
    // Seed realistic numbers based on product ID
    setViewers(seededRand(productId + "v", 8, 34));
    setRecentOrders(seededRand(productId + "o", 3, 18));

    // Slowly fluctuate viewers every 12s
    const interval = setInterval(() => {
      setViewers(v => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(5, Math.min(40, v + delta));
      });
    }, 12000);
    return () => clearInterval(interval);
  }, [productId]);

  const isLowStock = stock !== undefined && stock > 0 && stock <= 5;
  const isOutOfStock = stock !== undefined && stock === 0;

  if (isOutOfStock) {
    return (
      <div className={`flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full text-red-600 font-bold ${compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1.5 text-xs"}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        Out of Stock
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        {isLowStock && (
          <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 animate-pulse">
            <Flame size={9} className="text-red-500" />
            <span className="text-[9px] font-bold text-red-600">Only {stock} left!</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-[9px] text-gray-400">
          <Eye size={9} />
          <span>{viewers} viewing</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Stock warning */}
      {isLowStock && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 animate-pulse">
          <Flame size={14} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-black text-red-600">Only {stock} left in stock!</p>
            <p className="text-[10px] text-red-400">Order soon before it sells out</p>
          </div>
        </div>
      )}

      {/* Viewer count */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
          <Eye size={12} className="text-amber-500" />
          <span className="text-[11px] font-bold text-amber-700">
            {viewers} people viewing this now
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-1.5">
          <Clock size={12} className="text-green-500" />
          <span className="text-[11px] font-bold text-green-700">
            {recentOrders} sold in last 24h
          </span>
        </div>
      </div>
    </div>
  );
}
