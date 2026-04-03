"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck, RefreshCw, Package, CheckCircle, XCircle, AlertCircle,
  Download, BookOpen, ChevronDown, ChevronUp, Search, Clock
} from "lucide-react";
import { getRecentOrders } from "@/lib/firestore";
import type { Order as FirestoreOrder } from "@/types";

interface Order {
  id: string;
  refNumber: string;
  customerName: string;
  customerPhone: string;
  cityName: string;
  deliveryAddress: string;
  total: number;
  status: string;
  postexTrackingNumber?: string;
  items?: { name: string; qty: number; unitPrice: number }[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:      { label: "Pending",      color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  booked:       { label: "Booked",       color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_transit:   { label: "In Transit",   color: "bg-purple-100 text-purple-700 border-purple-200" },
  at_warehouse: { label: "At Warehouse", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  delivered:    { label: "Delivered",    color: "bg-green-100 text-green-700 border-green-200" },
  returned:     { label: "Returned",     color: "bg-red-100 text-red-600 border-red-200" },
  cancelled:    { label: "Cancelled",    color: "bg-gray-100 text-gray-500 border-gray-200" },
  attempted:    { label: "Attempted",    color: "bg-orange-100 text-orange-700 border-orange-200" },
};

function Badge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] ?? { label: status, color: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border font-semibold ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function PostexPage() {
  const [tab, setTab] = useState<"unbooked" | "booked">("unbooked");
  const [unbooked, setUnbooked] = useState<Order[]>([]);
  const [booked, setBooked] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setDataLoading(true);
    try {
      const all = await getRecentOrders(200) as FirestoreOrder[];
      setUnbooked(all.filter(o => o.status === "pending") as Order[]);
      setBooked(all.filter(o => o.status !== "pending" && o.status !== "cancelled") as Order[]);
    } catch (e) {
      console.error("Failed to load orders", e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function selectAll() {
    const list = tab === "unbooked" ? unbooked : booked;
    setSelected(new Set(list.map(o => o.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function bookOrder(orderId: string) {
    setBookingId(orderId);
    try {
      const res = await fetch("/api/postex/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      showToast(`✅ Order booked — Tracking: ${data.trackingNumber}`);
      await loadOrders(); // reload real data
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Booking failed", "error");
    } finally {
      setBookingId(null);
    }
  }

  async function bulkBook() {
    setLoading(true);
    const ids = Array.from(selected).filter(id => unbooked.some(o => o.id === id));
    let success = 0;
    for (const id of ids) {
      try {
        const res = await fetch("/api/postex/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id }),
        });
        if (res.ok) success++;
      } catch {}
    }
    showToast(`✅ Booked ${success} of ${ids.length} orders`);
    setSelected(new Set());
    await loadOrders();
    setLoading(false);
  }

  async function refreshStatus(orderId: string, tracking: string) {
    setRefreshingId(orderId);
    try {
      const res = await fetch(`/api/postex/track?tracking=${encodeURIComponent(tracking)}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Failed");
      showToast("✅ Status refreshed");
      await loadOrders();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Refresh failed", "error");
    } finally {
      setRefreshingId(null);
    }
  }

  async function bulkRefresh() {
    setLoading(true);
    const ids = Array.from(selected).filter(id => booked.some(o => o.id === id));
    let success = 0;
    for (const id of ids) {
      const order = booked.find(o => o.id === id);
      if (!order?.postexTrackingNumber) continue;
      try {
        await fetch(`/api/postex/track?tracking=${encodeURIComponent(order.postexTrackingNumber)}`);
        success++;
      } catch {}
    }
    showToast(`✅ Refreshed ${success} orders`);
    setSelected(new Set());
    await loadOrders();
    setLoading(false);
  }

  async function downloadLoadSheet() {
    setSheetLoading(true);
    try {
      const trackingNumbers = Array.from(selected)
        .map(id => booked.find(o => o.id === id)?.postexTrackingNumber)
        .filter(Boolean) as string[];

      if (trackingNumbers.length === 0) {
        showToast("Select booked orders first", "error");
        setSheetLoading(false);
        return;
      }

      const res = await fetch("/api/postex/loadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumbers }),
      });

      if (!res.ok) throw new Error("Failed to generate load sheet");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LoadSheet-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("✅ Load sheet downloaded");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Download failed", "error");
    } finally {
      setSheetLoading(false);
    }
  }

  const currentList = tab === "unbooked" ? unbooked : booked;
  const filtered = currentList.filter(o =>
    !search ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.refNumber.toLowerCase().includes(search.toLowerCase()) ||
    (o.postexTrackingNumber ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold transition-all ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">PostEx Hub</h1>
          <p className="text-sm text-gray-400">{dataLoading ? "Loading orders..." : "Book, track and manage courier shipments"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadOrders} disabled={dataLoading}
            className="flex items-center gap-1.5 bg-pink-50 text-[#e91e8c] px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-pink-100 disabled:opacity-60">
            <RefreshCw size={14} className={dataLoading ? "animate-spin" : ""}/>
          </button>
          <a href="https://merchant.postex.pk" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-purple-100">
            <Truck size={14}/> PostEx Portal
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending Booking", value: unbooked.length, color: "bg-yellow-50 text-yellow-800", icon: <Clock size={18}/> },
          { label: "In Transit", value: booked.filter(o => o.status === "in_transit").length, color: "bg-purple-50 text-purple-800", icon: <Truck size={18}/> },
          { label: "Delivered", value: booked.filter(o => o.status === "delivered").length, color: "bg-green-50 text-green-800", icon: <CheckCircle size={18}/> },
          { label: "Returned", value: booked.filter(o => o.status === "returned").length, color: "bg-red-50 text-red-800", icon: <XCircle size={18}/> },
        ].map(c => (
          <div key={c.label} className={`rounded-2xl p-4 ${c.color}`}>
            <div className="mb-2 opacity-70">{c.icon}</div>
            <div className="text-2xl font-black">{c.value}</div>
            <div className="text-sm font-semibold opacity-80">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab("unbooked"); setSelected(new Set()); }}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${tab === "unbooked" ? "bg-[#e91e8c] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200"}`}>
          📋 Unbooked ({unbooked.length})
        </button>
        <button onClick={() => { setTab("booked"); setSelected(new Set()); }}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${tab === "booked" ? "bg-[#e91e8c] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200"}`}>
          🚚 Booked ({booked.length})
        </button>
      </div>

      {/* Search + Bulk Actions */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ref, tracking..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e91e8c]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={selectAll} className="text-xs px-3 py-2 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200">
              Select All
            </button>
            <button onClick={clearSelection} className="text-xs px-3 py-2 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200">
              Clear
            </button>
            {tab === "unbooked" && selected.size > 0 && (
              <button onClick={bulkBook} disabled={loading}
                className="text-xs px-4 py-2 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5">
                {loading ? <RefreshCw size={12} className="animate-spin"/> : <BookOpen size={12}/>}
                Book {selected.size} Orders
              </button>
            )}
            {tab === "booked" && selected.size > 0 && (
              <>
                <button onClick={bulkRefresh} disabled={loading}
                  className="text-xs px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5">
                  {loading ? <RefreshCw size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
                  Refresh {selected.size}
                </button>
                <button onClick={downloadLoadSheet} disabled={sheetLoading}
                  className="text-xs px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5">
                  {sheetLoading ? <RefreshCw size={12} className="animate-spin"/> : <Download size={12}/>}
                  Load Sheet
                </button>
              </>
            )}
          </div>
        </div>
        {selected.size > 0 && (
          <p className="text-xs text-[#e91e8c] mt-2 font-semibold">{selected.size} order(s) selected</p>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-40"/>
            <p className="font-semibold">No orders found</p>
          </div>
        )}

        {filtered.map(order => {
          const isExpanded = expandedId === order.id;
          const isSelected = selected.has(order.id);
          const isBookingThis = bookingId === order.id;
          const isRefreshingThis = refreshingId === order.id;

          return (
            <div key={order.id} className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${isSelected ? "border-[#e91e8c]" : "border-transparent"}`}>
              <div className="flex items-center gap-3 p-4">
                {/* Checkbox */}
                <button onClick={() => toggleSelect(order.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-[#e91e8c] border-[#e91e8c]" : "border-gray-300"}`}>
                  {isSelected && <CheckCircle size={12} className="text-white"/>}
                </button>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-[#e91e8c] flex-shrink-0">
                  {order.customerName[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">{order.customerName}</div>
                  <div className="text-xs text-gray-400">
                    {order.refNumber}
                    {order.postexTrackingNumber && <> · <span className="font-mono text-purple-600">{order.postexTrackingNumber}</span></>}
                  </div>
                  <div className="text-xs text-gray-400">{order.cityName}</div>
                </div>

                {/* Right */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-[#8b0057] text-sm mb-1">Rs. {order.total.toLocaleString()}</div>
                  <Badge status={order.status}/>
                </div>

                {/* Expand */}
                <button onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="text-gray-400 hover:text-gray-600 ml-1">
                  {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </button>
              </div>

              {/* Expanded Panel */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400 text-xs">Phone</span><div className="font-semibold">{order.customerPhone}</div></div>
                    <div><span className="text-gray-400 text-xs">City</span><div className="font-semibold">{order.cityName}</div></div>
                    <div className="col-span-2"><span className="text-gray-400 text-xs">Address</span><div className="font-semibold">{order.deliveryAddress}</div></div>
                    {order.postexTrackingNumber && (
                      <div className="col-span-2"><span className="text-gray-400 text-xs">Tracking Number</span><div className="font-mono font-bold text-purple-700">{order.postexTrackingNumber}</div></div>
                    )}
                  </div>

                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Items</p>
                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-pink-50 rounded-lg px-3 py-1.5">
                            <span className="font-semibold text-gray-700">{item.name} <span className="text-gray-400">×{item.qty}</span></span>
                            <span className="font-bold text-[#8b0057]">Rs. {(item.unitPrice * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {tab === "unbooked" && (
                      <button onClick={() => bookOrder(order.id)} disabled={isBookingThis}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60">
                        {isBookingThis ? <RefreshCw size={14} className="animate-spin"/> : <BookOpen size={14}/>}
                        Book on PostEx
                      </button>
                    )}
                    {tab === "booked" && order.postexTrackingNumber && (
                      <>
                        <button onClick={() => refreshStatus(order.id, order.postexTrackingNumber!)} disabled={isRefreshingThis}
                          className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60">
                          {isRefreshingThis ? <RefreshCw size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                          Refresh Status
                        </button>
                        <a href={`https://merchant.postex.pk/tracking/${order.postexTrackingNumber}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90">
                          <Truck size={14}/> Track on PostEx
                        </a>
                      </>
                    )}
                    <a href={`https://wa.me/${order.customerPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90">
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!dataLoading && unbooked.length === 0 && booked.length === 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-400">
          <Package size={32} className="mx-auto mb-2 opacity-40"/>
          <p className="font-semibold text-gray-600">No orders yet</p>
          <p className="text-sm mt-1">Orders placed by customers will appear here for booking.</p>
        </div>
      )}
    </div>
  );
}
