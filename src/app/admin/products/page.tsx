"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Tag, Gift, Save, RefreshCw, AlertCircle, Percent
} from "lucide-react";
import {
  getProducts, saveProduct, deleteProduct,
  getBundles, saveBundle, deleteBundle,
} from "@/lib/firestore";
import { DEFAULT_PRODUCTS, DEFAULT_BUNDLES } from "@/lib/catalogue";
import type { Product, Bundle } from "@/types";

const CATEGORIES = ["Colour", "Skincare", "Body", "Hair", "Other"];

// ─── Colour Swatch ──────────────────────────────────────────────
function ColorSwatch({ hex, name }: { hex: string; name: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: hex }} />
      <span className="text-xs text-gray-600">{name}</span>
    </div>
  );
}

// ─── Product Form ────────────────────────────────────────────────
function ProductForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<Product>;
  onSave: (p: Omit<Product, "id"> & { id?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Product>>({
    name: "", subtitle: "", description: "", price: 0, emoji: "✨",
    shades: [], needsShade: false, active: true,
    ...initial,
    // When editing: if no oldPrice exists, seed it equal to price so the UI shows a non-discounted product correctly
    oldPrice: initial?.oldPrice ?? initial?.price ?? 0,
  });
  const [shadeInput, setShadeInput] = useState({ name: "", hex: "#e91e8c" });

  function addShade() {
    if (!shadeInput.name) return;
    setForm(f => ({ ...f, shades: [...(f.shades ?? []), { ...shadeInput }] }));
    setShadeInput({ name: "", hex: "#e91e8c" });
  }

  function removeShade(i: number) {
    setForm(f => ({ ...f, shades: f.shades?.filter((_, idx) => idx !== i) }));
  }

  function submit() {
    if (!form.name || !form.price) return;
    const hasShades = (form.shades?.length ?? 0) > 0;
    const salePrice = Number(form.price);
    const origPrice = form.oldPrice ? Number(form.oldPrice) : undefined;
    // Only store oldPrice if there's actually a discount
    const hasDiscount = origPrice && origPrice > salePrice;
    onSave({
      id: form.id,
      name: form.name!,
      subtitle: form.subtitle ?? "",
      description: form.description ?? "",
      price: salePrice,
      oldPrice: hasDiscount ? origPrice : undefined,
      badge: form.badge,
      badgeColor: form.badgeColor,
      emoji: form.emoji ?? "✨",
      shades: form.shades ?? [],
      needsShade: hasShades ? (form.needsShade ?? false) : false,
      active: form.active ?? true,
      stock: form.stock ? Number(form.stock) : undefined,
      imageUrl: form.imageUrl,
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-[#e91e8c] p-5 space-y-4">
      <h3 className="font-bold text-[#8b0057]">{form.id ? "Edit Product" : "New Product"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]" placeholder="e.g. Lip & Cheek Tint" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Emoji</label>
          <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]" placeholder="💄" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Subtitle</label>
          <input value={form.subtitle ?? ""} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]" placeholder="e.g. 30ml" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Badge (optional)</label>
          <input value={form.badge ?? ""} onChange={e => setForm(f => ({ ...f, badge: e.target.value || undefined }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]" placeholder="e.g. Bestseller" />
        </div>
        {/* ── Price + Discount section ── */}
        <div className="sm:col-span-2 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Percent size={14} className="text-[#e91e8c]" />
            <span className="text-xs font-black text-[#8b0057] uppercase tracking-wide">Pricing & Discount</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Original Price (Rs.) *</label>
              <input
                type="number"
                value={form.oldPrice ?? form.price ?? ""}
                onChange={e => {
                  const orig = Number(e.target.value) || 0;
                  setForm(f => {
                    // If there&apos;s already a sale price set, keep it; otherwise set both
                    const hasSale = f.oldPrice && f.price && f.price < f.oldPrice;
                    return hasSale
                      ? { ...f, oldPrice: orig }
                      : { ...f, oldPrice: orig, price: orig };
                  });
                }}
                className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]"
                placeholder="e.g. 1200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Discount %</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={
                    form.oldPrice && form.price && form.oldPrice > form.price
                      ? Math.round(((form.oldPrice - form.price) / form.oldPrice) * 100)
                      : ""
                  }
                  onChange={e => {
                    const pct = Math.min(90, Math.max(0, Number(e.target.value) || 0));
                    const orig = form.oldPrice ?? form.price ?? 0;
                    if (orig > 0) {
                      const salePrice = Math.round(orig * (1 - pct / 100));
                      setForm(f => ({ ...f, price: salePrice }));
                    }
                  }}
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c] pr-7"
                  placeholder="0"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Sale Price (Rs.) *</label>
              <input
                type="number"
                value={form.price ?? ""}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) || 0 }))}
                className="w-full border border-[#e91e8c] bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8b0057] font-bold text-[#e91e8c]"
                placeholder="e.g. 960"
              />
            </div>
          </div>

          {/* Live discount preview */}
          {form.oldPrice && form.price && form.oldPrice > form.price && (
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-pink-200">
              <span className="text-xs text-gray-400 line-through">Rs. {Number(form.oldPrice).toLocaleString()}</span>
              <span className="text-sm font-black text-[#e91e8c]">Rs. {Number(form.price).toLocaleString()}</span>
              <span className="text-[10px] font-black bg-amber-400 text-white px-1.5 py-0.5 rounded-full ml-auto">
                -{Math.round(((Number(form.oldPrice) - Number(form.price ?? 0)) / Number(form.oldPrice)) * 100)}% OFF
              </span>
              <span className="text-[10px] text-green-600 font-bold">
                Save Rs. {(Number(form.oldPrice) - Number(form.price)).toLocaleString()}
              </span>
            </div>
          )}
          {(!form.oldPrice || (form.price ?? 0) >= form.oldPrice) && (
            <p className="text-[10px] text-gray-400">
              💡 Set Original Price first, then enter a Discount % — the Sale Price will auto-calculate.
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Stock (optional)</label>
          <input type="number" value={form.stock ?? ""} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) || undefined }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]" placeholder="Leave blank for unlimited" />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${form.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {form.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {form.active ? "Active" : "Inactive"}
          </button>
          {(form.shades?.length ?? 0) > 0 && (
            <button type="button" onClick={() => setForm(f => ({ ...f, needsShade: !f.needsShade }))}
              className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${form.needsShade ? "bg-pink-100 text-[#e91e8c]" : "bg-gray-100 text-gray-500"}`}>
              {form.needsShade ? "Shade required" : "Shade optional"}
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c] resize-none" placeholder="Short product description..." />
      </div>

      {/* Shades */}
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-2 block">Shades / Variants (optional)</label>
        {form.shades && form.shades.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {form.shades.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-pink-50 rounded-full px-2.5 py-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.hex }} />
                {s.name}
                <button type="button" onClick={() => removeShade(i)} className="text-gray-400 hover:text-red-500 ml-0.5"><X size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input value={shadeInput.name} onChange={e => setShadeInput(s => ({ ...s, name: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addShade()}
            placeholder="Shade name" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#e91e8c]" />
          <input type="color" value={shadeInput.hex} onChange={e => setShadeInput(s => ({ ...s, hex: e.target.value }))}
            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
          <button type="button" onClick={addShade} className="bg-pink-100 text-[#e91e8c] px-3 py-2 rounded-xl text-xs font-bold hover:bg-pink-200">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={submit} disabled={saving}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save to Firebase"}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Bundle Form ─────────────────────────────────────────────────
function BundleForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<Bundle>;
  onSave: (b: Omit<Bundle, "id"> & { id?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Bundle>>({
    name: "", includes: "", price: 0, oldPrice: 0, emoji: "🎁", productIds: [], active: true,
    ...initial,
  });

  function submit() {
    if (!form.name || !form.price) return;
    onSave({
      id: form.id,
      name: form.name!,
      emoji: form.emoji ?? "🎁",
      includes: form.includes ?? "",
      price: Number(form.price),
      oldPrice: Number(form.oldPrice ?? 0),
      productIds: form.productIds ?? [],
      active: form.active ?? true,
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-purple-400 p-5 space-y-4">
      <h3 className="font-bold text-purple-700">{form.id ? "Edit Bundle" : "New Bundle"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Bundle Name *</label>
          <input value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="e.g. Glow Bundle" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Emoji</label>
          <input value={form.emoji ?? ""} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="🎁" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Price (Rs.) *</label>
          <input type="number" value={form.price ?? ""} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Old Price (strike-through)</label>
          <input type="number" value={form.oldPrice ?? ""} onChange={e => setForm(f => ({ ...f, oldPrice: Number(e.target.value) || 0 }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="Optional" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Includes (what&apos;s in the bundle)</label>
          <input value={form.includes ?? ""} onChange={e => setForm(f => ({ ...f, includes: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="e.g. Tint + Serum + Mask" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${form.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {form.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {form.active ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={submit} disabled={saving}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-60">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save to Firebase"}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [tab, setTab] = useState<"products" | "bundles">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null | "new">(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null | "new">(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, bunds] = await Promise.all([getProducts(), getBundles()]);
      setProducts(prods.filter(p => p.active !== false));
      setBundles(bunds.filter(b => b.active !== false));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load from Firebase");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Seed default data into Firebase if collections are empty
  async function seedDefaults() {
    setSaving(true);
    try {
      const seedProds = DEFAULT_PRODUCTS.map(p => ({ ...p, needsShade: p.needsShade ?? false }));
      const seedBunds = DEFAULT_BUNDLES.map(b => ({ ...b }));
      await Promise.all([
        ...seedProds.map(p => saveProduct(p)),
        ...seedBunds.map(b => saveBundle(b)),
      ]);
      setSeeded(true);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProduct(p: Omit<Product, "id"> & { id?: string }) {
    setSaving(true);
    setError(null);
    try {
      await saveProduct(p);
      await load();
      setEditingProduct(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Archive this product? It will be hidden from the store.")) return;
    setSaving(true);
    try {
      await deleteProduct(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleProduct(p: Product) {
    setSaving(true);
    try {
      await saveProduct({ ...p, active: !p.active });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBundle(b: Omit<Bundle, "id"> & { id?: string }) {
    setSaving(true);
    setError(null);
    try {
      await saveBundle(b);
      await load();
      setEditingBundle(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save bundle");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBundle(id: string) {
    if (!confirm("Archive this bundle? It will be hidden from the store.")) return;
    setSaving(true);
    try {
      await deleteBundle(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete bundle");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBundle(b: Bundle) {
    setSaving(true);
    try {
      await saveBundle({ ...b, active: !b.active });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update bundle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Products & Bundles</h1>
          <p className="text-sm text-gray-400">Changes save directly to Firebase & update the store instantly</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-[#e91e8c] disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => tab === "products" ? setEditingProduct("new") : setEditingBundle("new")}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-4 py-2 rounded-full text-sm font-bold hover:opacity-90">
            <Plus size={14} /> Add {tab === "products" ? "Product" : "Bundle"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-full text-sm font-bold ${tab === "products" ? "bg-[#e91e8c] text-white shadow" : "bg-white text-gray-600 border border-gray-200"}`}>
          <span className="flex items-center gap-1.5"><Tag size={14} /> Products ({products.length})</span>
        </button>
        <button onClick={() => setTab("bundles")}
          className={`px-4 py-2 rounded-full text-sm font-bold ${tab === "bundles" ? "bg-[#e91e8c] text-white shadow" : "bg-white text-gray-600 border border-gray-200"}`}>
          <span className="flex items-center gap-1.5"><Gift size={14} /> Bundles ({bundles.length})</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={24} className="animate-spin text-[#e91e8c]" />
          <span className="ml-2 text-gray-400 text-sm">Loading from Firebase...</span>
        </div>
      )}

      {/* Empty state with seed option */}
      {!loading && products.length === 0 && bundles.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 mb-4">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold text-gray-600 mb-1">No products in Firebase yet</p>
          <p className="text-sm mb-4">Seed the default Beauty Bee catalogue to get started instantly.</p>

          <button onClick={seedDefaults} disabled={saving}
            className="bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 disabled:opacity-60 flex items-center gap-2 mx-auto">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? "Seeding..." : "Seed Default Products"}
          </button>
        </div>
      )}

      {seeded && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-semibold">
          ✅ Default products seeded to Firebase successfully!
        </div>
      )}

      {/* Product form */}
      {!loading && tab === "products" && editingProduct && (
        <div className="mb-5">
          <ProductForm
            initial={editingProduct === "new" ? undefined : editingProduct}
            onSave={handleSaveProduct}
            onCancel={() => setEditingProduct(null)}
            saving={saving}
          />
        </div>
      )}

      {/* Bundle form */}
      {!loading && tab === "bundles" && editingBundle && (
        <div className="mb-5">
          <BundleForm
            initial={editingBundle === "new" ? undefined : editingBundle}
            onSave={handleSaveBundle}
            onCancel={() => setEditingBundle(null)}
            saving={saving}
          />
        </div>
      )}

      {/* Products list */}
      {!loading && tab === "products" && products.length > 0 && (
        <div className="space-y-3">
          {products.map(p => {
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${!p.active ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3 p-4">
                  <div className="text-3xl">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">{p.name}</span>
                      {p.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.badgeColor === "green" ? "bg-green-100 text-green-700" : "bg-pink-100 text-[#e91e8c]"}`}>{p.badge}</span>}
                      {!p.active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                    </div>
                    {p.subtitle && <div className="text-xs text-gray-400">{p.subtitle}</div>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-black text-[#8b0057] text-sm">Rs. {p.price.toLocaleString()}</span>
                      {p.oldPrice && <span className="text-xs line-through text-gray-400">Rs. {p.oldPrice.toLocaleString()}</span>}
                      {p.stock !== undefined && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Stock: {p.stock}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => handleToggleProduct(p)} disabled={saving}
                      className={`p-1.5 rounded-lg ${p.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}>
                      {p.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => setEditingProduct(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id)} disabled={saving} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-40">
                      <Trash2 size={15} />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : p.id)} className="p-1.5 text-gray-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-50 p-4 space-y-3">
                    <p className="text-sm text-gray-600">{p.description}</p>
                    {p.shades && p.shades.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2">Shades {p.needsShade ? "(required)" : "(optional)"}</p>
                        <div className="flex flex-wrap gap-3">
                          {p.shades.map((s, i) => <ColorSwatch key={i} hex={s.hex ?? "#ccc"} name={s.name} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bundles list */}
      {!loading && tab === "bundles" && bundles.length > 0 && (
        <div className="space-y-3">
          {bundles.map(b => (
            <div key={b.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${!b.active ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{b.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-800">{b.name}</span>
                    {!b.active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{b.includes}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-black text-[#8b0057] text-sm">Rs. {b.price.toLocaleString()}</span>
                    {b.oldPrice > 0 && <span className="text-xs line-through text-gray-400">Rs. {b.oldPrice.toLocaleString()}</span>}
                    {b.oldPrice > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Save Rs. {(b.oldPrice - b.price).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleToggleBundle(b)} disabled={saving}
                    className={`p-1.5 rounded-lg ${b.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}>
                    {b.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => setEditingBundle(b)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDeleteBundle(b.id)} disabled={saving} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-40">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
