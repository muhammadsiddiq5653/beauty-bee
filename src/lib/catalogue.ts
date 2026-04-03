/**
 * Default product catalogue — seeds Firestore on first run.
 * Admin can override via the products page.
 */
import type { Product, Bundle } from "@/types";

export const DEFAULT_PRODUCTS: Omit<Product, "id">[] = [
  {
    name: "Lip & Cheek Tint",
    subtitle: "Choose your shade",
    emoji: "💋",
    description: "Buildable, long-lasting colour for lips & cheeks. 100% organic formula.",
    price: 450,
    oldPrice: 600,
    badge: "Bestseller",
    badgeColor: "pink",
    shades: [
      { name: "Red Berry", hex: "#8B1A1A" },
      { name: "Pink Rose", hex: "#E75480" },
      { name: "Nude Pink", hex: "#D4918A" },
      { name: "Coral", hex: "#FF7F50" },
    ],
    needsShade: true,
    active: true,
  },
  {
    name: "Skin Whitening Mask",
    subtitle: "200g Jar",
    emoji: "✨",
    description: "Brightens, firms & minimises pores. 100% organic ingredients.",
    price: 850,
    oldPrice: 1100,
    badge: "Organic",
    badgeColor: "green",
    shades: [],
    needsShade: false,
    active: true,
  },
  {
    name: "Face Glowing Serum",
    subtitle: "30ml",
    emoji: "🌟",
    description: "Clears skin, reduces dark spots and blemishes. Budget-friendly glow.",
    price: 700,
    oldPrice: 900,
    badge: "Organic",
    badgeColor: "green",
    shades: [],
    needsShade: false,
    active: true,
  },
  {
    name: "Organic Beauty Soap",
    subtitle: "Handmade",
    emoji: "🧼",
    description: "Exfoliating & brightening soap made with natural oils.",
    price: 300,
    oldPrice: 400,
    badge: undefined,
    shades: [],
    needsShade: false,
    active: true,
  },
];

export const DEFAULT_BUNDLES: Omit<Bundle, "id">[] = [
  {
    name: "Starter Kit",
    emoji: "🌸",
    includes: "1 Lip & Cheek Tint (any shade) + 1 Organic Soap",
    price: 699,
    oldPrice: 750,
    productIds: ["tint", "soap"],
    active: true,
  },
  {
    name: "Glow Bundle ⭐",
    emoji: "✨",
    includes: "Lip & Cheek Tint + Face Serum + Organic Soap",
    price: 1299,
    oldPrice: 1450,
    productIds: ["tint", "serum", "soap"],
    active: true,
  },
  {
    name: "Complete Skincare Set",
    emoji: "👑",
    includes: "Tint + Serum + Whitening Mask + Soap — full routine",
    price: 1999,
    oldPrice: 2450,
    productIds: ["tint", "serum", "mask", "soap"],
    active: true,
  },
  {
    name: "Shade Duo",
    emoji: "💕",
    includes: "Any 2 Lip & Cheek Tints — mix & match shades",
    price: 799,
    oldPrice: 900,
    productIds: ["tint", "tint"],
    active: true,
  },
];
