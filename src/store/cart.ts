import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, Bundle } from "@/types";
import { trackPixel, PIXEL_CURRENCY } from "@/lib/fbpixel";

const DELIVERY = parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200");

interface CartState {
  items: CartItem[];
  // Actions
  addItem: (product: Product, qty: number, shade?: string) => void;
  addBundle: (bundle: Bundle) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clearCart: () => void;
  // Derived
  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
  // Drawer UI state
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,

      addItem: (product, qty, shade) => {
        const key = product.id + (shade ? `_${shade}` : "");
        const existing = get().items.find(i => i.key === key);
        const shadeImage = shade ? product.shades.find(s => s.name === shade)?.imageUrl : undefined;
        if (existing) {
          set(s => ({
            items: s.items.map(i =>
              i.key === key ? { ...i, qty: i.qty + qty } : i
            ),
          }));
        } else {
          set(s => ({
            items: [
              ...s.items,
              {
                key,
                productId: product.id,
                name: product.name + (shade ? ` (${shade})` : ""),
                qty,
                unitPrice: product.price,
                shade,
                emoji: product.emoji,
                imageUrl: shadeImage ?? product.imageUrl,
                isBundle: false,
              },
            ],
          }));
        }
        trackPixel("AddToCart", {
          content_ids: [product.id],
          content_name: product.name + (shade ? ` (${shade})` : ""),
          content_type: "product",
          contents: [{ id: product.id, quantity: qty }],
          value: product.price * qty,
          currency: PIXEL_CURRENCY,
        });
        get().openDrawer();
      },

      addBundle: (bundle) => {
        const key = `bundle_${bundle.id}`;
        const existing = get().items.find(i => i.key === key);
        if (existing) {
          set(s => ({
            items: s.items.map(i =>
              i.key === key ? { ...i, qty: i.qty + 1 } : i
            ),
          }));
        } else {
          set(s => ({
            items: [
              ...s.items,
              {
                key,
                productId: bundle.id,
                name: bundle.name,
                qty: 1,
                unitPrice: bundle.price,
                emoji: bundle.emoji,
                imageUrl: bundle.imageUrl,
                isBundle: true,
              },
            ],
          }));
        }
        trackPixel("AddToCart", {
          content_ids: [bundle.id],
          content_name: bundle.name,
          content_type: "product",
          contents: [{ id: bundle.id, quantity: 1 }],
          value: bundle.price,
          currency: PIXEL_CURRENCY,
        });
        get().openDrawer();
      },

      removeItem: (key) =>
        set(s => ({ items: s.items.filter(i => i.key !== key) })),

      updateQty: (key, qty) => {
        if (qty <= 0) get().removeItem(key);
        else
          set(s => ({
            items: s.items.map(i => (i.key === key ? { ...i, qty } : i)),
          }));
      },

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((s, i) => s + i.qty * i.unitPrice, 0),

      total: () => {
        const sub = get().subtotal();
        return sub > 0 ? sub + DELIVERY : 0;
      },

      itemCount: () =>
        get().items.reduce((s, i) => s + i.qty, 0),

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: "bb-cart",
      // Only persist items, not UI state
      partialize: (s) => ({ items: s.items }),
    }
  )
);
