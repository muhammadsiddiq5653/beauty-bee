"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, BarChart3,
  Truck, LogOut, Menu, X, ChevronRight
} from "lucide-react";

const NAV = [
  { href: "/admin",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/orders",   label: "Orders",     icon: ShoppingBag },
  { href: "/admin/postex",   label: "PostEx",     icon: Truck },
  { href: "/admin/products", label: "Products",   icon: Package },
  { href: "/admin/analytics",label: "Analytics",  icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (sessionStorage.getItem("bb_admin") === "1") setAuthed(true);
  }, []);

  async function login() {
    setChecking(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        sessionStorage.setItem("bb_admin", "1");
        setAuthed(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("bb_admin");
    setAuthed(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#8b0057] to-[#e91e8c] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
          <div className="text-5xl mb-3">🐝</div>
          <h1 className="text-2xl font-black text-[#8b0057] mb-1">Beauty Bee Admin</h1>
          <p className="text-gray-400 text-sm mb-6">Enter your admin PIN to continue</p>
          <input
            type="password" placeholder="Admin PIN" value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !checking && login()}
            className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest focus:outline-none focus:border-[#e91e8c] mb-3"
          />
          {error && <p className="text-red-500 text-sm mb-3">⚠️ Incorrect PIN</p>}
          <button onClick={login} disabled={checking}
            className="w-full bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white py-3 rounded-full font-black text-base hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {checking ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"></span> Verifying...</>
            ) : "Enter Admin →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 shadow-sm fixed h-full z-30">
        <div className="p-5 border-b border-pink-100">
          <div className="text-2xl">🐝</div>
          <div className="font-black text-[#8b0057] text-lg">Beauty Bee</div>
          <div className="text-xs text-gray-400">Admin Dashboard</div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(n => {
            const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active ? "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white shadow-md" : "text-gray-600 hover:bg-pink-50 hover:text-[#8b0057]"
                }`}>
                <n.icon size={18}/> {n.label}
                {active && <ChevronRight size={14} className="ml-auto"/>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link href="/order" target="_blank"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#e91e8c] px-3 py-2 rounded-xl hover:bg-pink-50 mb-1">
            <ShoppingBag size={14}/> View Customer Store
          </Link>
          <button onClick={logout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 w-full">
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐝</span>
          <span className="font-black text-[#8b0057]">Admin</span>
        </div>
        <button onClick={() => setSideOpen(!sideOpen)} className="text-gray-500">
          {sideOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSideOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl p-4" onClick={e => e.stopPropagation()}>
            <div className="mb-4 pb-3 border-b border-pink-100">
              <div className="font-black text-[#8b0057] text-lg">🐝 Beauty Bee</div>
              <div className="text-xs text-gray-400">Admin Dashboard</div>
            </div>
            <nav className="space-y-1">
              {NAV.map(n => {
                const active = pathname === n.href;
                return (
                  <Link key={n.href} href={n.href} onClick={() => setSideOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                      active ? "bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white" : "text-gray-600 hover:bg-pink-50"
                    }`}>
                    <n.icon size={18}/> {n.label}
                  </Link>
                );
              })}
            </nav>
            <button onClick={logout} className="mt-4 flex items-center gap-2 text-sm text-gray-400 px-3 py-2">
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-60 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
