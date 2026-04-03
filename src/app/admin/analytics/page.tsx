"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, ShoppingBag, Package, RefreshCw,
  ArrowUpRight, ArrowDownRight, Banknote, RotateCcw,
} from "lucide-react";
import { getAllOrders } from "@/lib/firestore";
import type { Order } from "@/types";

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  delivered:    "#22c55e",
  in_transit:   "#a855f7",
  booked:       "#3b82f6",
  pending:      "#eab308",
  returned:     "#ef4444",
  cancelled:    "#9ca3af",
  at_warehouse: "#6366f1",
  attempted:    "#f97316",
  under_review: "#0ea5e9",
};

const CHART_PINK  = "#e91e8c";
const CHART_DARK  = "#8b0057";
const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #f3e6f0",
  borderRadius: 12,
  fontSize: 12,
  padding: "8px 12px",
};

// ── Small helpers ──────────────────────────────────────────────────────────

function dayKey(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function pct(num: number, den: number) {
  return den === 0 ? 0 : Math.round((num / den) * 100);
}

// ── StatCard ───────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color, trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: { delta: number; label: string };
}) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <div className="mb-2 opacity-70">{icon}</div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm font-semibold opacity-80">{label}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
      {trend && (
        <div className={`flex items-center gap-0.5 text-xs mt-1.5 font-semibold ${trend.delta >= 0 ? "opacity-80" : "opacity-70"}`}>
          {trend.delta >= 0
            ? <ArrowUpRight size={12}/>
            : <ArrowDownRight size={12}/>}
          {Math.abs(trend.delta)}% {trend.label}
        </div>
      )}
    </div>
  );
}

// ── Analytics derivation ───────────────────────────────────────────────────

function deriveStats(orders: Order[]) {
  const now = Date.now();
  const MS_DAY = 86_400_000;

  // ── KPIs ──
  const totalOrders   = orders.length;
  const totalRevenue  = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const delivered  = orders.filter(o => o.status === "delivered");
  const returned   = orders.filter(o => o.status === "returned");
  const cancelled  = orders.filter(o => o.status === "cancelled");

  const codCollected   = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
  const deliveryRate   = pct(delivered.length, totalOrders);
  const returnRate     = pct(returned.length, totalOrders);
  const cancellationRate = pct(cancelled.length, totalOrders);

  // ── Week-over-week comparison ──
  const thisWeekOrders = orders.filter(o => (now - new Date(o.createdAt).getTime()) < 7 * MS_DAY);
  const lastWeekOrders = orders.filter(o => {
    const age = now - new Date(o.createdAt).getTime();
    return age >= 7 * MS_DAY && age < 14 * MS_DAY;
  });
  const thisWeekRev = thisWeekOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const lastWeekRev = lastWeekOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const weekRevDelta = lastWeekRev === 0 ? 0 : Math.round(((thisWeekRev - lastWeekRev) / lastWeekRev) * 100);
  const weekOrdDelta = lastWeekOrders.length === 0 ? 0 : Math.round(((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100);

  // ── Daily revenue — last 30 days ──
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * MS_DAY);
    dailyMap.set(dayKey(d.toISOString()), { revenue: 0, orders: 0 });
  }
  orders.forEach(o => {
    const age = Math.floor((now - new Date(o.createdAt).getTime()) / MS_DAY);
    if (age < 30) {
      const k = dayKey(o.createdAt);
      const ex = dailyMap.get(k) ?? { revenue: 0, orders: 0 };
      dailyMap.set(k, { revenue: ex.revenue + (o.total ?? 0), orders: ex.orders + 1 });
    }
  });
  // Show every 3rd label to avoid crowding; all entries have date + fullDate
  const daily30: Array<{ date: string; fullDate: string; revenue: number; orders: number }> =
    Array.from(dailyMap.entries()).map(([d, v], i) => ({
      date: i % 3 === 0 ? d : "",
      fullDate: d,
      ...v,
    }));

  // ── Monthly revenue (all time) ──
  const monthMap = new Map<string, { revenue: number; orders: number }>();
  orders.forEach(o => {
    const k = monthKey(o.createdAt);
    const ex = monthMap.get(k) ?? { revenue: 0, orders: 0 };
    monthMap.set(k, { revenue: ex.revenue + (o.total ?? 0), orders: ex.orders + 1 });
  });
  // monthly entries also carry date/fullDate so the chart data union stays consistent
  const monthly: Array<{ date: string; fullDate: string; month: string; revenue: number; orders: number }> =
    Array.from(monthMap.entries()).map(([m, v]) => ({
      date: m,
      fullDate: m,
      month: m,
      ...v,
    }));

  // ── Orders by city — top 8 ──
  const cityMap = new Map<string, { orders: number; revenue: number }>();
  orders.forEach(o => {
    const city = (o.cityName ?? "Unknown").trim();
    const ex = cityMap.get(city) ?? { orders: 0, revenue: 0 };
    cityMap.set(city, { orders: ex.orders + 1, revenue: ex.revenue + (o.total ?? 0) });
  });
  const cityData = Array.from(cityMap.entries())
    .map(([city, v]) => ({ city, ...v }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8);

  // ── Status breakdown ──
  const statusMap = new Map<string, number>();
  orders.forEach(o => statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1));
  const statusPie = Array.from(statusMap.entries()).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: STATUS_COLORS[name] ?? "#9ca3af",
  })).sort((a, b) => b.value - a.value);

  // ── Top products by revenue ──
  const productMap = new Map<string, { sold: number; revenue: number }>();
  orders.forEach(o => {
    o.items?.forEach(i => {
      const key = i.name.split(" (")[0]; // strip shade suffix
      const ex = productMap.get(key) ?? { sold: 0, revenue: 0 };
      productMap.set(key, { sold: ex.sold + i.qty, revenue: ex.revenue + i.qty * i.unitPrice });
    });
  });
  const productData = Array.from(productMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Avg daily orders (last 30 days) ──
  const activedays30 = daily30.filter(d => d.orders > 0).length;
  const avgDailyOrders = activedays30 > 0
    ? (thisWeekOrders.length + lastWeekOrders.length > 0
        ? Math.round(orders.filter(o => (now - new Date(o.createdAt).getTime()) < 30 * MS_DAY).length / 30)
        : 0)
    : 0;

  return {
    totalRevenue, totalOrders, avgOrderValue, deliveryRate, returnRate,
    cancellationRate, codCollected, weekRevDelta, weekOrdDelta,
    thisWeekOrders: thisWeekOrders.length, avgDailyOrders,
    daily30, monthly, cityData, statusPie, productData,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"30d" | "monthly">("30d");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (e) {
      console.error("Failed to load orders for analytics", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => orders.length > 0 ? deriveStats(orders) : null, [orders]);

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Analytics</h1>
          <p className="text-sm text-gray-400">
            {loading ? "Loading…" : `All ${orders.length.toLocaleString()} orders`}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 bg-pink-50 text-[#e91e8c] px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-pink-100 disabled:opacity-60">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <RefreshCw size={28} className="animate-spin mx-auto text-[#e91e8c] mb-3"/>
          <p className="text-gray-400 text-sm">Fetching all orders from Firestore…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="font-semibold text-gray-600">No data yet</p>
          <p className="text-sm mt-1">Analytics will appear once orders start coming in.</p>
        </div>
      )}

      {!loading && stats && (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<TrendingUp size={20}/>}
              label="Total Revenue"
              value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
              sub={`Avg Rs. ${stats.avgOrderValue.toLocaleString()} / order`}
              color="bg-gradient-to-br from-[#8b0057] to-[#e91e8c] text-white"
              trend={{ delta: stats.weekRevDelta, label: "vs last week" }}
            />
            <StatCard
              icon={<ShoppingBag size={20}/>}
              label="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              sub={`${stats.thisWeekOrders} this week`}
              color="bg-blue-50 text-blue-800"
              trend={{ delta: stats.weekOrdDelta, label: "vs last week" }}
            />
            <StatCard
              icon={<Banknote size={20}/>}
              label="COD Collected"
              value={`Rs. ${stats.codCollected.toLocaleString()}`}
              sub={`${stats.deliveryRate}% delivery rate`}
              color="bg-green-50 text-green-800"
            />
            <StatCard
              icon={<RotateCcw size={20}/>}
              label="Return Rate"
              value={`${stats.returnRate}%`}
              sub={`${stats.cancellationRate}% cancellation`}
              color="bg-red-50 text-red-800"
            />
          </div>

          {/* ── Revenue Chart ── */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Revenue Over Time</h2>
              <div className="flex gap-1.5">
                {(["30d", "monthly"] as const).map(m => (
                  <button key={m} onClick={() => setChartMode(m)}
                    className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${chartMode === m ? "bg-[#e91e8c] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {m === "30d" ? "Last 30 Days" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={chartMode === "30d" ? stats.daily30 : stats.monthly}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce4f1"/>
                <XAxis
                  dataKey={chartMode === "30d" ? "date" : "month"}
                  tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}/>
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(_label, payload) => {
                    if (chartMode === "30d" && payload?.[0]?.payload?.fullDate) {
                      return payload[0].payload.fullDate as string;
                    }
                    return _label;
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: unknown, name: unknown) => [
                    name === "revenue" ? `Rs. ${(v as number).toLocaleString()}` : v as number,
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}/>
                <Line type="monotone" dataKey="revenue" stroke={CHART_PINK} strokeWidth={2.5}
                  dot={false} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Orders by City + Status Pie ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4">Orders by City (Top 8)</h2>
              {stats.cityData.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No city data</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.cityData} layout="vertical"
                    margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#fce4f1"/>
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }}
                      axisLine={false} tickLine={false} width={75}/>
                    <Tooltip contentStyle={TOOLTIP_STYLE}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: unknown) => [v as number, "Orders"]}/>
                    <Bar dataKey="orders" fill={CHART_PINK} radius={[0, 6, 6, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4">Order Status Breakdown</h2>
              {stats.statusPie.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No status data</p>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={stats.statusPie} cx="50%" cy="50%"
                        innerRadius={50} outerRadius={75}
                        dataKey="value" paddingAngle={2}>
                        {stats.statusPie.map((entry, i) => (
                          <Cell key={i} fill={entry.color}/>
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: unknown, _n: unknown, props: any) => [
                          `${v as number} (${pct(v as number, stats.totalOrders)}%)`,
                          (props?.payload?.name as string) ?? "",
                        ]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {stats.statusPie.map(s => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color }}/>
                          <span className="text-gray-600">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-700">{s.value}</span>
                          <span className="text-gray-400">
                            {pct(s.value, stats.totalOrders)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Top Products ── */}
          {stats.productData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4">Top Products by Revenue</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.productData}
                  margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fce4f1"/>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.length > 12 ? v.slice(0, 12) + "…" : v}/>
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: unknown, name: unknown) => [
                      name === "revenue" ? `Rs. ${(v as number).toLocaleString()}` : v as number,
                      name === "revenue" ? "Revenue" : "Units Sold",
                    ]}/>
                  <Legend wrapperStyle={{ fontSize: 11 }}/>
                  <Bar dataKey="revenue" fill={CHART_DARK} name="Revenue" radius={[4, 4, 0, 0]}/>
                  <Bar dataKey="sold"    fill={CHART_PINK} name="Units Sold" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Summary Row ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Avg Order Value",    value: `Rs. ${stats.avgOrderValue.toLocaleString()}` },
              { label: "Delivery Rate",       value: `${stats.deliveryRate}%` },
              { label: "Return Rate",         value: `${stats.returnRate}%` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <div className="text-xl font-black text-[#8b0057]">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5 font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
