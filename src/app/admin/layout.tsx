"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, BarChart3,
  Truck, LogOut, Menu, X, ChevronRight, Eye, EyeOff, Settings, Tag
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const NAV = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/orders",    label: "Orders",     icon: ShoppingBag },
  { href: "/admin/postex",    label: "PostEx",     icon: Truck },
  { href: "/admin/products",  label: "Products",   icon: Package },
  { href: "/admin/promos",    label: "Promos",     icon: Tag },
  { href: "/admin/analytics", label: "Analytics",  icon: BarChart3 },
  { href: "/admin/settings",  label: "Settings",   icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSigning(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      await fetch("/api/admin/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setSigning(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    await signOut(auth);
  }

  // Still checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed in — show login
  if (!user) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4">
        <form onSubmit={login} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Image src="/logo.svg" alt="Beauty Bee" width={120} height={48} />
            </div>
            <h1 className="font-serif font-bold text-xl text-[#1A1A1A]">Beauty Bee Admin</h1>
            <p className="text-sm text-[#6B6B6B] mt-1">Sign in with your admin account</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@beautybee.pk"
                required
                className="w-full border border-[#EDE8E4] rounded-2xl px-4 py-3 text-sm bg-[#FAF7F4] focus:outline-none focus:border-[#9B2B47] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-[#EDE8E4] rounded-2xl px-4 py-3 pr-11 text-sm bg-[#FAF7F4] focus:outline-none focus:border-[#9B2B47] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#9B2B47]"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs mt-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={signing}
            className="w-full mt-5 bg-[#9B2B47] hover:bg-[#7D1E35] text-white py-3 rounded-full font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {signing ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Signing in...</>
            ) : "Sign In →"}
          </button>
        </form>
      </div>
    );
  }

  // Signed in — show admin
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 shadow-sm fixed h-full z-30">
        <div className="p-5 border-b border-gray-100">
          <Image src="/logo.svg" alt="Beauty Bee" width={100} height={40} className="mb-1" />
          <div className="text-xs text-[#6B6B6B] mt-0.5 truncate">{user.email}</div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(n => {
            const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-[#9B2B47] text-white"
                    : "text-gray-600 hover:bg-[#F9ECF0] hover:text-[#9B2B47]"
                }`}>
                <n.icon size={17} /> {n.label}
                {active && <ChevronRight size={13} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link href="/shop" target="_blank"
            className="flex items-center gap-2 text-xs text-[#6B6B6B] hover:text-[#9B2B47] px-3 py-2 rounded-xl hover:bg-[#F9ECF0] mb-1 transition-colors">
            <ShoppingBag size={13} /> View Customer Store
          </Link>
          <button onClick={logout}
            className="flex items-center gap-2 text-xs text-[#6B6B6B] hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 w-full transition-colors">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Image src="/logo.svg" alt="Beauty Bee" width={90} height={36} />
        </div>
        <button onClick={() => setSideOpen(!sideOpen)} className="text-gray-500">
          {sideOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSideOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl p-4" onClick={e => e.stopPropagation()}>
            <div className="mb-4 pb-3 border-b border-gray-100">
              <Image src="/logo.svg" alt="Beauty Bee" width={90} height={36} />
              <div className="text-xs text-[#6B6B6B] mt-0.5 truncate">{user.email}</div>
            </div>
            <nav className="space-y-1">
              {NAV.map(n => {
                const active = pathname === n.href;
                return (
                  <Link key={n.href} href={n.href} onClick={() => setSideOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                      active ? "bg-[#9B2B47] text-white" : "text-gray-600 hover:bg-[#F9ECF0]"
                    }`}>
                    <n.icon size={17} /> {n.label}
                  </Link>
                );
              })}
            </nav>
            <button onClick={logout} className="mt-4 flex items-center gap-2 text-sm text-[#6B6B6B] px-3 py-2 hover:text-red-500">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-60 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
