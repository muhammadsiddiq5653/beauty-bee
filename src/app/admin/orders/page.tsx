"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Truck, X, CheckCircle,
  Clock, Package, RefreshCw, Phone, MapPin,
  ExternalLink, AlertCircle, Download
} from "lucide-react";
import { getRecentOrders } from "@/lib/firestore";
import type { Order, OrderStatus } from "@/types";

const STATUS: Record<string, { label: string; bg: string; icon: React.ReactNode }> = {
  pending:      { label: "Pending",      bg: "bg-yellow-100 text-yellow-700 border-yellow-200",  icon: <Clock size={12}/> },
  booked:       { label: "Booked",       bg: "bg-blue-100 text-blue-700 border-blue-200",        icon: <Package size={12}/> },
  in_transit:   { label: "In Transit",   bg: "bg-purple-100 text-purple-700 border-purple-200",  icon: <Truck size={12}/> },
  delivered:    { label: "Delivered",    bg: "bg-green-100 text-green-700 border-green-200",     icon: <CheckCircle size={12}/> },
  returned:     { label: "Returned",     bg: "bg-red-100 text-red-600 border-red-200",           icon: <X size={12}/> },
  cancelled:    { label: "Cancelled",    bg: "bg-gray-100 text-gray-500 border-gray-200",        icon: <X size={12}/> },
  at_warehouse: { label: "At Warehouse", bg: "bg-indigo-100 text-indigo-700 border-indigo-200",  icon: <Package size={12}/> },
  attempted:    { label: "Attempted",    bg: "bg-orange-100 text-orange-700 border-orange-200",  icon: <AlertCircle size={12}/> },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookResult, setBookResult] = useState<string>("");
  const [trackResult, setTrackResult] = useState<string>("");
  const [tracking, setTracking] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecentOrders(200);
      setOrders(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      o.customerName.toLowerCase().includes(q) ||
      o.refNumber.toLowerCase().includes(q) ||
      o.customerPhone.includes(search) ||
      (o.postexTrackingNumber ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function bookOnPostex(order: Order) {
    setBooking(true); setBookResult("");
    try {
      const res = await fetch("/api/postex/book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const d = await res.json();
      if (d.trackingNumber) {
        setBookResult(`✓ Booked! Tracking: ${d.trackingNumber}`);
        // Refresh orders to get updated status
        load();
      } else {
        setBookResult(`Error: ${d.error}`);
      }
    } catch { setBookResult("Booking failed — check PostEx API token."); }
    finally { setBooking(false); }
  }

  async function refreshStatus(trackingNumber: string) {
    setTracking(true); setTrackResult("");
    try {
      const res = await fetch(`/api/postex/track?tracking=${trackingNumber}`);
      const d = await res.json();
      if (d.ok) {
        setTrackResult(`Status: ${d.latestStatus ?? d.status}`);
        load(); // refresh order list
      } else {
        setTrackResult(`Error: ${d.error}`);
      }
    } catch { setTrackResult("Tracking failed."); }
    finally { setTracking(false); }
  }

  async function cancelOrder(order: Order) {
    if (!confirm(`Cancel order ${order.refNumber}?`)) return;
    setCancellingId(order.id);
    try {
      await fetch("/api/postex/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, reason: "Admin cancelled" }),
      });
      load();
      setSelected(null);
    } catch { alert("Cancel failed."); }
    finally { setCancellingId(null); }
  }

  function exportCSV() {
    const rows = [
      ["Ref", "Customer", "Phone", "City", "Items", "Total", "Status", "Tracking", "Date"],
      ...filtered.map(o => [
        o.refNumber, o.customerName, o.customerPhone, o.cityName,
        o.items?.map(i => `${i.name} x${i.qty}`).join(" | ") ?? "",
        o.total, o.status, o.postexTrackingNumber ?? "",
        new Date(o.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.map(String).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beauty-bee-orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stat = (s: string) => STATUS[s] ?? { label: s, bg: "bg-gray-100 text-gray-500 border-gray-200", icon: null };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Orders</h1>
          <p className="text-sm text-gray-400">
            {loading ? "Loading..." : `${filtered.length} order${filtered.length !== 1 ? "s" : ""}${statusFilter !== "all" ? ` · ${STATUS[statusFilter]?.label}` : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 bg-pink-50 text-[#e91e8c] px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-pink-100 disabled:opacity-60">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
          </button>
          <button onClick={exportCSV} disabled={loading || filtered.length === 0}
            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-200 disabled:opacity-40">
            <Download size={14}/> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">⚠️ {error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input placeholder="Search name, phone, ref, tracking..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border-2 border-pink-100 rounded-xl bg-white text-sm focus:outline-none focus:border-[#e91e8c]"/>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border-2 border-pink-100 rounded-xl px-3 py-2.5 bg-white text-sm focus:outline-none focus:border-[#e91e8c]">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <RefreshCw size={28} className="animate-spin mx-auto text-[#e91e8c] mb-3"/>
          <p className="text-gray-400 text-sm">Loading orders from Firebase...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="font-semibold text-gray-600">No orders yet</p>
          <p className="text-sm mt-1">Orders will appear here once customers start ordering.</p>
        </div>
      )}

      {/* Order List */}
      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
            <span>Customer</span><span>Order</span><span>Items</span><span>Total</span><span>Status</span><span>Actions</span>
          </div>

          <div className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-30"/>
                <p className="font-semibold">No orders match your filters</p>
              </div>
            ) : filtered.map(o => {
              const s = stat(o.status);
              const isExpanded = selected?.id === o.id;
              return (
                <div key={o.id} className="hover:bg-gray-50 transition-colors">
                  {/* Mobile Row */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setSelected(isExpanded ? null : o)}>
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-[#e91e8c] font-black flex-shrink-0">{o.customerName[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{o.customerName}</div>
                      <div className="text-xs text-gray-400">{o.refNumber} · {o.cityName}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-[#8b0057] text-sm">Rs. {o.total.toLocaleString()}</div>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${s.bg}`}>{s.icon}{s.label}</span>
                    </div>
                  </div>

                  {/* Desktop Row */}
                  <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 items-center text-sm">
                    <div>
                      <div className="font-semibold text-gray-800">{o.customerName}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10}/>{o.customerPhone}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs text-gray-600">{o.refNumber}</div>
                      {o.postexTrackingNumber && <div className="text-xs text-blue-600 font-mono">{o.postexTrackingNumber}</div>}
                      <div className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      {o.items?.map((i, idx) => <div key={idx} className="text-xs text-gray-600 truncate">{i.name} × {i.qty}</div>)}
                    </div>
                    <div className="font-bold text-[#8b0057]">Rs. {o.total.toLocaleString()}</div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-semibold whitespace-nowrap ${s.bg}`}>{s.icon}{s.label}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelected(isExpanded ? null : o); setBookResult(""); setTrackResult(""); }}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold hover:bg-blue-100">Details</button>
                      {o.status === "pending" && (
                        <button onClick={() => { setSelected(o); bookOnPostex(o); }}
                          className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-semibold hover:bg-purple-100 flex items-center gap-1">
                          <Truck size={10}/> Book
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mx-4 mb-4 bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Customer</p>
                          <p className="text-sm font-bold text-gray-800">{o.customerName}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5"><Phone size={12}/>{o.customerPhone}</p>
                          <p className="text-xs text-gray-500 flex items-start gap-1 mt-1"><MapPin size={12} className="mt-0.5 flex-shrink-0"/>{o.deliveryAddress}, {o.cityName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Order Info</p>
                          <p className="text-sm font-mono text-gray-700">{o.refNumber}</p>
                          {o.postexTrackingNumber && <p className="text-sm font-mono text-blue-600">{o.postexTrackingNumber}</p>}
                          <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</p>
                          {o.transactionNotes && <p className="text-xs text-gray-600 mt-1 italic">"{o.transactionNotes}"</p>}
                        </div>
                      </div>

                      {o.items && o.items.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-2">Items</p>
                          <div className="space-y-1">
                            {o.items.map((i, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">{i.name} × {i.qty}</span>
                                <span className="font-semibold text-gray-800">Rs. {(i.qty * i.unitPrice).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm border-t pt-1 mt-1 text-gray-500">
                              <span>Delivery</span><span>Rs. {(o.deliveryCharge ?? 200).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-black text-[#e91e8c]">
                              <span>Total (COD)</span><span>Rs. {o.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {o.status === "pending" && (
                          <button onClick={() => bookOnPostex(o)} disabled={booking}
                            className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-60">
                            <Truck size={14}/>{booking ? "Booking..." : "Book on PostEx"}
                          </button>
                        )}
                        {o.postexTrackingNumber && (
                          <button onClick={() => refreshStatus(o.postexTrackingNumber!)} disabled={tracking}
                            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                            <RefreshCw size={14} className={tracking ? "animate-spin" : ""}/>
                            {tracking ? "Refreshing..." : "Refresh Status"}
                          </button>
                        )}
                        {o.postexTrackingNumber && (
                          <a href={`https://postex.pk/tracking?trackingNumber=${o.postexTrackingNumber}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200">
                            <ExternalLink size={14}/> PostEx Portal
                          </a>
                        )}
                        {o.status !== "cancelled" && o.status !== "delivered" && (
                          <button onClick={() => cancelOrder(o)} disabled={cancellingId === o.id}
                            className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 border border-red-200 disabled:opacity-60">
                            <X size={14}/>{cancellingId === o.id ? "Cancelling..." : "Cancel Order"}
                          </button>
                        )}
                        <a href={`https://wa.me/${o.customerPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600">
                          💬 WhatsApp
                        </a>
                      </div>

                      {bookResult && (
                        <div className={`text-sm px-3 py-2 rounded-xl border ${bookResult.startsWith("✓") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                          {bookResult}
                        </div>
                      )}
                      {trackResult && (
                        <div className="text-sm px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                          {trackResult}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
