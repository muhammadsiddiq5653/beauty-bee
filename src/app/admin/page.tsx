"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag, TrendingUp, Package, Truck,
  Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, RefreshCw
} from "lucide-react";
import { getRecentOrders } from "@/lib/firestore";
import type { Order } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:      { label: "Pending",      color: "bg-yellow-100 text-yellow-700 border-yellow-200",  icon: <Clock size={12}/> },
  booked:       { label: "Booked",       color: "bg-blue-100 text-blue-700 border-blue-200",        icon: <Package size={12}/> },
  in_transit:   { label: "In Transit",   color: "bg-purple-100 text-purple-700 border-purple-200",  icon: <Truck size={12}/> },
  delivered:    { label: "Delivered",    color: "bg-green-100 text-green-700 border-green-200",     icon: <CheckCircle size={12}/> },
  returned:     { label: "Returned",     color: "bg-red-100 text-red-600 border-red-200",           icon: <XCircle size={12}/> },
  cancelled:    { label: "Cancelled",    color: "bg-gray-100 text-gray-500 border-gray-200",        icon: <XCircle size={12}/> },
  at_warehouse: { label: "At Warehouse", color: "bg-indigo-100 text-indigo-700 border-indigo-200",  icon: <Package size={12}/> },
  attempted:    { label: "Attempted",    color: "bg-orange-100 text-orange-700 border-orange-200",  icon: <AlertCircle size={12}/> },
};

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <div className="mb-2 opacity-80">{icon}</div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm font-semibold opacity-80">{label}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecentOrders(100);
      setOrders(data);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === "pending").length;
  const delivered = orders.filter(o => o.status === "delivered").length;

  return (
    <div className="p-4 md:p-6">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-400">
            {loading ? "Loading..." : `Updated ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 bg-pink-50 text-[#e91e8c] px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-pink-100 disabled:opacity-60">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<TrendingUp size={20}/>} label="Today's Revenue" value={loading ? "—" : `Rs. ${todayRevenue.toLocaleString()}`} sub={loading ? "" : `${todayOrders.length} orders today`} color="bg-gradient-to-br from-[#8b0057] to-[#e91e8c] text-white"/>
        <StatCard icon={<ShoppingBag size={20}/>} label="Total Orders" value={loading ? "—" : orders.length} sub="All time" color="bg-blue-50 text-blue-800"/>
        <StatCard icon={<Clock size={20}/>} label="Pending Booking" value={loading ? "—" : pending} sub="Need PostEx booking" color="bg-yellow-50 text-yellow-800"/>
        <StatCard icon={<CheckCircle size={20}/>} label="Delivered" value={loading ? "—" : delivered} sub="Successfully delivered" color="bg-green-50 text-green-800"/>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { href: "/admin/orders",    label: "View All Orders",  icon: <ShoppingBag size={18}/>, color: "border-blue-200 text-blue-700 hover:bg-blue-50" },
          { href: "/admin/postex",    label: "Book on PostEx",   icon: <Truck size={18}/>,       color: "border-purple-200 text-purple-700 hover:bg-purple-50" },
          { href: "/admin/products",  label: "Manage Products",  icon: <Package size={18}/>,     color: "border-green-200 text-green-700 hover:bg-green-50" },
          { href: "/admin/analytics", label: "View Analytics",   icon: <TrendingUp size={18}/>,  color: "border-orange-200 text-orange-700 hover:bg-orange-50" },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`flex items-center gap-2 border-2 rounded-xl px-3 py-3 font-semibold text-sm transition-colors ${a.color}`}>
            {a.icon} {a.label} <ChevronRight size={14} className="ml-auto"/>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Recent Orders</h2>
          <Link href="/admin/orders" className="text-[#e91e8c] text-sm font-semibold hover:underline flex items-center gap-1">
            View All <ChevronRight size={14}/>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={24} className="animate-spin mx-auto text-[#e91e8c] mb-2"/>
            <p className="text-sm text-gray-400">Loading orders from Firebase...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-40"/>
            <p className="font-semibold">No orders yet</p>
            <p className="text-sm">Orders will appear here once customers start placing them.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.slice(0, 8).map(o => {
              const s = STATUS_CONFIG[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-500 border-gray-200", icon: null };
              return (
                <Link key={o.id} href={`/admin/orders?id=${o.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-sm font-bold text-[#e91e8c] flex-shrink-0">
                    {o.customerName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{o.customerName}</div>
                    <div className="text-xs text-gray-400">{o.refNumber} · {o.cityName}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-[#8b0057] text-sm">Rs. {o.total.toLocaleString()}</div>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${s.color}`}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
