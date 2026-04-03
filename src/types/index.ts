// ─── Product Types ──────────────────────────────────────────────
export interface Shade {
  name: string;
  hex?: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  description: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  badgeColor?: "pink" | "green" | "gold";
  shades: Shade[];
  needsShade: boolean;
  active: boolean;
  stock?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Bundle {
  id: string;
  name: string;
  emoji: string;
  includes: string;
  price: number;
  oldPrice: number;
  productIds: string[];
  active: boolean;
  createdAt?: string;
}

// ─── Cart ───────────────────────────────────────────────────────
export interface CartItem {
  key: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  shade?: string;
  isBundle?: boolean;
}

// ─── Order Types ────────────────────────────────────────────────
export type OrderStatus =
  | "pending"       // created, not yet sent to PostEx
  | "booked"        // sent to PostEx, tracking number received
  | "at_warehouse"  // 0001 — At Merchant's Warehouse
  | "in_transit"    // 0003 — At PostEx Warehouse / 0004 — Package on Route
  | "delivered"     // 0005 — Delivered
  | "returned"      // 0006/0007 — Returned
  | "under_review"  // 0008
  | "attempted"     // 0013 — Attempt Made
  | "cancelled";

export interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  shade?: string;
}

export interface Order {
  id: string;                   // Firestore document ID
  refNumber: string;            // BB-XXXXXXXX
  status: OrderStatus;

  // Customer
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  cityName: string;
  transactionNotes?: string;

  // Items
  items: OrderItem[];
  itemSummary: string;
  pieceCount: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;                // invoicePayment sent to PostEx

  // PostEx
  postexTrackingNumber?: string;
  postexOrderStatus?: string;
  postexOrderDate?: string;

  // Timestamps
  createdAt: string;            // ISO string
  updatedAt: string;
}

// ─── PostEx API Types (v4.1.9) ──────────────────────────────────
export interface PostexCreateOrderPayload {
  orderRefNumber: string;
  invoicePayment: string;       // string per spec
  orderDetail?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  transactionNotes?: string;
  cityName: string;
  invoiceDivision: number;      // 1 for single parcel
  items: number;                // piece count
  pickupAddressCode?: string;
  orderType: "Normal" | "Reverse" | "Replacement";
}

export interface PostexCreateOrderResponse {
  statusCode: string;
  statusMessage: string;
  dist: {
    trackingNumber: string;
    orderStatus: string;
    orderDate: string;
  };
}

export interface PostexCity {
  operationalCityName: string;
  countryName: string;
  isPickupCity: string;
  isDeliveryCity: string;
}

export interface PostexTrackingHistory {
  transactionStatusMessage: string;
  transactionStatusMessageCode: string;
}

export interface PostexTrackingResponse {
  statusCode: string;
  statusMessage: string;
  dist: {
    trackingNumber: string;
    customerName: string;
    cityName: string;
    transactionStatus: string;
    transactionStatusHistory: PostexTrackingHistory[];
    orderRefNumber: string;
    invoicePayment: number;
  };
}

// ─── Analytics ──────────────────────────────────────────────────
export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductSales {
  name: string;
  units: number;
  revenue: number;
}
