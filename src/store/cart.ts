import { create } from "zustand";
import type { CartItem, Product, Bundle } from "@/types";

interface CartState {
  items: CartItem[];
  selectedBundle: Bundle | null;
  addItem: (product: Product, qty: number, shade?: string) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  setBundle: (bundle: Bundle | null) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
}

const DELIVERY = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedBundle: null,

  addItem: (product, qty, shade) => {
    const key = product.id + (shade ? `_${shade}` : "");
    const existing = get().items.find(i => i.key === key);
    if (existing) {
      set(s => ({ items: s.items.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i) }));
    } else {
      set(s => ({
        items: [...s.items, {
          key,
          productId: product.id,
          name: product.name + (shade ? ` (${shade})` : ""),
          qty,
          unitPrice: product.price,
          shade,
        }],
      }));
    }
  },

  removeItem: (key) => set(s => ({ items: s.items.filter(i => i.key !== key) })),

  updateQty: (key, qty) => {
    if (qty <= 0) get().removeItem(key);
    else set(s => ({ items: s.items.map(i => i.key === key ? { ...i, qty } : i) }));
  },

  setBundle: (bundle) => set({ selectedBundle: bundle }),

  clearCart: () => set({ items: [], selectedBundle: null }),

  subtotal: () => {
    const { items, selectedBundle } = get();
    const itemTotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    return itemTotal + (selectedBundle?.price ?? 0);
  },

  total: () => {
    const sub = get().subtotal();
    return sub > 0 ? sub + DELIVERY : 0;
  },

  itemCount: () => {
    const { items, selectedBundle } = get();
    return items.reduce((s, i) => s + i.qty, 0) + (selectedBundle ? 1 : 0);
  },
}));
