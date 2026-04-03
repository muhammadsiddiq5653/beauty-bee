/**
 * Firestore helpers — all order and product CRUD lives here.
 * Collections:
 *   orders/    — every Beauty Bee order
 *   products/  — product catalogue
 *   bundles/   — bundle catalogue
 */
import {
  collection, doc, addDoc, updateDoc, getDocs, getDoc,
  query, orderBy, limit, where, Timestamp, onSnapshot,
  DocumentSnapshot, QuerySnapshot,
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

export async function saveProduct(product: Omit<Product, "id"> & { id?: string }): Promise<string> {
  const now = new Date().toISOString();
  if (product.id) {
    const { id, ...data } = product;
    await updateDoc(doc(db, "products", id), { ...data, updatedAt: now });
    return id;
  } else {
    const ref = await addDoc(collection(db, "products"), { ...product, createdAt: now, updatedAt: now });
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
    await updateDoc(doc(db, "bundles", id), { ...data });
    return id;
  } else {
    const ref = await addDoc(collection(db, "bundles"), { ...bundle, createdAt: now });
    return ref.id;
  }
}
