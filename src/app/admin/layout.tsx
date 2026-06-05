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
      <div className="bb-page grid place-items-center">
        <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>
        <span className="relative z-10 h-7 w-7 animate-spin rounded-full border-2 border-[rgba(155,43,71,0.18)] border-t-[var(--bb-berry)]" />
      </div>
    );
  }

  // Not signed in — show login
  if (!user) {
    return (
      <div className="bb-page grid place-items-center p-4">
        <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>
        <form onSubmit={login} className="bb-glass relative z-10 w-full max-w-sm rounded-[30px] p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Image src="/logo.svg" alt="Beauty Bee" width={120} height={48} />
            </div>
            <p className="bb-eyebrow">Operations Suite</p>
            <h1 className="bb-serif mt-2 text-4xl leading-none text-[var(--bb-ink)]">Beauty Bee Admin</h1>
            <p className="text-sm font-semibold text-[var(--bb-ink-soft)] mt-2">Sign in with your admin account</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-black text-[var(--bb-ink-soft)] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@beautybee.pk"
                required
                className="bb-input"
              />
            </div>
            <div>
              <label className="text-xs font-black text-[var(--bb-ink-soft)] block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="bb-input pr-11"
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
            className="bb-btn bb-btn-primary mt-5 w-full disabled:opacity-60"
          >
            {signing ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Signing in...</>
            ) : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  // Signed in — show admin
  return (
    <div className="bb-admin bb-admin-main flex">
      {/* Sidebar — desktop */}
      <aside className="bb-glass fixed z-30 hidden h-full w-64 flex-col border-r border-white/60 md:flex">
        <div className="p-5 border-b border-[rgba(155,43,71,0.08)]">
          <Image src="/logo.svg" alt="Beauty Bee" width={100} height={40} className="mb-1" />
          <div className="mt-2 text-xs font-bold text-[var(--bb-ink-soft)] truncate">{user.email}</div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(n => {
            const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-black transition-all ${
                  active
                    ? "bg-[var(--bb-berry)] text-white shadow-lg shadow-[rgba(155,43,71,0.16)]"
                    : "text-[var(--bb-ink-soft)] hover:bg-white/70 hover:text-[var(--bb-berry)]"
                }`}>
                <n.icon size={17} /> {n.label}
                {active && <ChevronRight size={13} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[rgba(155,43,71,0.08)]">
          <Link href="/shop" target="_blank"
            className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-[var(--bb-ink-soft)] transition-colors hover:bg-white/70 hover:text-[var(--bb-berry)]">
            <ShoppingBag size={13} /> View Customer Store
          </Link>
          <button onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-[var(--bb-ink-soft)] transition-colors hover:bg-red-50 hover:text-red-500">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="bb-glass fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3 md:hidden">
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
          <div className="bb-glass h-full w-64 p-4" onClick={e => e.stopPropagation()}>
            <div className="mb-4 pb-3 border-b border-gray-100">
              <Image src="/logo.svg" alt="Beauty Bee" width={90} height={36} />
              <div className="text-xs text-[#6B6B6B] mt-0.5 truncate">{user.email}</div>
            </div>
            <nav className="space-y-1">
              {NAV.map(n => {
                const active = pathname === n.href;
                return (
                  <Link key={n.href} href={n.href} onClick={() => setSideOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black ${
                      active ? "bg-[var(--bb-berry)] text-white" : "text-[var(--bb-ink-soft)] hover:bg-white/70"
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
      <div className="flex-1 pt-16 md:ml-64 md:pt-0">
        {children}
      </div>
    </div>
  );
}
