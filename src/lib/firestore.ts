/**
 * Firestore helpers — all order and product CRUD lives here.
 * Collections:
 *   orders/    — every Beauty Bee order
 *   products/  — product catalogue
 *   bundles/   — bundle catalogue
 *   settings/  — store configuration (single doc: settings/store)
 */
import {
  collection, doc, addDoc, updateDoc, setDoc, getDocs, getDoc,
  query, orderBy, limit, where, onSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, Product, Bundle, OrderStatus } from "@/types";

// ─── Orders ────────────────────────────────────────────────────
export async function createOrder(order: Omit<Order, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "orders"), {
    ...order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<void> {
  await updateDoc(doc(db, "orders", id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

export async function getOrderByRef(refNumber: string): Promise<Order | null> {
  const q = query(collection(db, "orders"), where("refNumber", "==", refNumber));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Order;
}

export async function getOrderByTracking(trackingNumber: string): Promise<Order | null> {
  const q = query(
    collection(db, "orders"),
    where("postexTrackingNumber", "==", trackingNumber)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Order;
}

export async function getRecentOrders(count = 50): Promise<Order[]> {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

/** Fetch every order ever — use for analytics only (no pagination limit). */
export async function getAllOrders(): Promise<Order[]> {
  const q = query(collection(db, "orders"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export function subscribeToOrders(
  callback: (orders: Order[]) => void,
  count = 100
) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(count));
  return onSnapshot(q, (snap: QuerySnapshot) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
  });
}

// ─── Products ──────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function saveProduct(product: Omit<Product, "id"> & { id?: string }): Promise<string> {
  const now = new Date().toISOString();
  if (product.id) {
    const { id, ...data } = product;
    await updateDoc(doc(db, "products", id), stripUndefined({ ...data, updatedAt: now }));
    return id;
  } else {
    const ref = await addDoc(collection(db, "products"), stripUndefined({ ...product, createdAt: now, updatedAt: now }));
    return ref.id;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  await updateDoc(doc(db, "products", id), { active: false });
}

// ─── Bundles ───────────────────────────────────────────────────
export async function getBundles(): Promise<Bundle[]> {
  const snap = await getDocs(collection(db, "bundles"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Bundle));
}

export async function saveBundle(bundle: Omit<Bundle, "id"> & { id?: string }): Promise<string> {
  const now = new Date().toISOString();
  if (bundle.id) {
    const { id, ...data } = bundle;
    await updateDoc(doc(db, "bundles", id), stripUndefined({ ...data }));
    return id;
  } else {
    const { id, ...data } = bundle;
    void id;
    const ref = await addDoc(collection(db, "bundles"), stripUndefined({ ...data, createdAt: now }));
    return ref.id;
  }
}

export async function deleteBundle(id: string): Promise<void> {
  await updateDoc(doc(db, "bundles", id), { active: false });
}

// ─── Store Settings ────────────────────────────────────────────
export interface MarketingBanner {
  id: string;
  type?: "announcement" | "hero" | "promo" | "trust" | "products" | "bundles" | "ingredients" | "reviews" | "trackLink";
  placement: "top" | "hero" | "middle" | "bottom";
  active: boolean;
  sortOrder?: number;
  eyebrow?: string;
  title: string;
  highlight?: string;
  body?: string;
  buttonLabel?: string;
  href?: string;
  imageUrl?: string;
  videoUrl?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface StoreSettings {
  deliveryCharge: number;
  freeDeliveryThreshold: number;  // 0 = disabled
  whatsappNumber: string;
  banners: MarketingBanner[];
}

export const DEFAULT_SETTINGS: StoreSettings = {
  deliveryCharge: parseInt(process.env.NEXT_PUBLIC_DELIVERY_CHARGE ?? "200"),
  freeDeliveryThreshold: 0,
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  banners: [
    {
      id: "default-top",
      type: "announcement",
      placement: "top",
      active: true,
      sortOrder: 10,
      title: "Free delivery on orders above Rs. 1,500",
    },
    {
      id: "default-hero",
      type: "hero",
      placement: "hero",
      active: true,
      sortOrder: 20,
      eyebrow: "Pakistan's Favourite Organic Tint",
      title: "Your Lips.",
      highlight: "Your Mood.",
      body: "Lip & Cheek Tint in 6 stunning shades, all-day wear, 100% organic.",
      buttonLabel: "Shop the Tint",
      href: "#products",
    },
    {
      id: "default-trust",
      type: "trust",
      placement: "middle",
      active: true,
      sortOrder: 30,
      title: "Trust Strip",
    },
    {
      id: "default-products",
      type: "products",
      placement: "middle",
      active: true,
      sortOrder: 40,
      eyebrow: "The Collection",
      title: "Lip & Cheek Tint",
      body: "One product. Multiple shades. Endless looks.",
    },
    {
      id: "default-bundles",
      type: "bundles",
      placement: "middle",
      active: true,
      sortOrder: 50,
      eyebrow: "Save More",
      title: "Complete Your Look",
      body: "Bundle deals crafted for the full Beauty Bee experience.",
    },
    {
      id: "default-middle",
      type: "promo",
      placement: "middle",
      active: true,
      sortOrder: 60,
      eyebrow: "Nationwide Shipping",
      title: "Flat Delivery Anywhere in Pakistan",
      body: "Cash on Delivery · PostEx Tracking · 2-5 Working Days",
      buttonLabel: "Order Now",
      href: "#products",
    },
    {
      id: "default-ingredients",
      type: "ingredients",
      placement: "middle",
      active: true,
      sortOrder: 70,
      title: "Pure. Honest. Organic.",
      body: "Formulated without parabens, sulphates, artificial fragrances or harsh chemicals.",
    },
    {
      id: "default-reviews",
      type: "reviews",
      placement: "middle",
      active: true,
      sortOrder: 80,
      eyebrow: "Social Proof",
      title: "What Our Customers Say",
    },
    {
      id: "default-track",
      type: "trackLink",
      placement: "bottom",
      active: true,
      sortOrder: 90,
      title: "Already ordered? Track your parcel",
      href: "/track",
    },
  ],
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const snap = await getDoc(doc(db, "settings", "store"));
  if (!snap.exists()) return { ...DEFAULT_SETTINGS };
  const data = snap.data() as Partial<StoreSettings>;
  const banners = data.banners && data.banners.length > 0 ? data.banners : DEFAULT_SETTINGS.banners;
  return { ...DEFAULT_SETTINGS, ...data, banners } as StoreSettings;
}

export async function updateStoreSettings(data: Partial<StoreSettings>): Promise<void> {
  await setDoc(doc(db, "settings", "store"), data, { merge: true });
}
