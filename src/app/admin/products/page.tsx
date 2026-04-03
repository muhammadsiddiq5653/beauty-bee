"use client";

import { useState, useEffect } from "react";
import {
  Package, Plus, Edit2, Trash2, Check, X, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Tag, Gift, Save
} from "lucide-react";

interface Shade {
  name: string;
  hex: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  shades: Shade[];
  active: boolean;
  emoji: string;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  items: string;
  active: boolean;
  emoji: string;
  badge?: string;
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: "p1", name: "Lip & Cheek Tint", description: "Multi-use tint for lips and cheeks. Long-lasting formula with natural finish.", price: 450, originalPrice: 600, category: "Colour", shades: [{ name: "Berry Pink", hex: "#C2185B" }, { name: "Coral Bliss", hex: "#FF7043" }, { name: "Nude Rose", hex: "#BCAAA4" }, { name: "Cherry Red", hex: "#C62828" }], active: true, emoji: "💄" },
  { id: "p2", name: "Skin Whitening Mask", description: "Brightening face mask with natural extracts. Reduces dark spots.", price: 850, category: "Skincare", shades: [], active: true, emoji: "✨" },
  { id: "p3", name: "Face Glowing Serum", description: "Lightweight vitamin C serum for radiant skin.", price: 700, originalPrice: 900, category: "Skincare", shades: [], active: true, emoji: "🌟" },
  { id: "p4", name: "Organic Soap Bar", description: "100% natural soap with essential oils. No harsh chemicals.", price: 300, category: "Body", shades: [{ name: "Lavender", hex: "#9575CD" }, { name: "Rose", hex: "#E91E8C" }], active: true, emoji: "🧼" },
];

const DEFAULT_BUNDLES: Bundle[] = [
  { id: "b1", name: "Starter Glow Kit", description: "Perfect for beginners", price: 699, originalPrice: 750, items: "Lip & Cheek Tint + Organic Soap", active: true, emoji: "🌸", badge: "Best Seller" },
  { id: "b2", name: "Glow Bundle", description: "Compete glow routine", price: 1299, originalPrice: 1550, items: "Skin Whitening Mask + Face Glowing Serum", active: true, emoji: "💎", badge: "Most Popular" },
  { id: "b3", name: "Complete Beauty Set", description: "Full beauty collection", price: 1999, originalPrice: 2300, items: "All 4 products", active: true, emoji: "👑", badge: "Best Value" },
  { id: "b4", name: "Shade Duo", description: "Two tints, double the fun", price: 799, originalPrice: 900, items: "2× Lip & Cheek Tint (any shades)", active: true, emoji: "🎨" },
];

const CATEGORIES = ["Colour", "Skincare", "Body", "Hair", "Other"];

function ColorSwatch({ hex, name }: { hex: string; name: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: hex }}/>
      <span className="text-xs text-gray-600">{name}</span>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel }: {
  initial?: Partial<Product>;
  onSave: (p: Product) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Product>>({
    name: "", description: "", price: 0, category: "Skincare", shades: [], active: true, emoji: "✨",
    ...initial
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
    onSave({
      id: form.id ?? `p${Date.now()}`,
      name: form.name!,
      description: form.description ?? "",
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      category: form.category ?? "Other",
      shades: form.shades ?? [],
      active: form.active ?? true,
      emoji: form.emoji ?? "✨",
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-[#e91e8c] p-5 space-y-4">
      <h3 className="font-bold text-[#8b0057]">{form.id ? "Edit Product" : "New Product"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]" placeholder="e.g. Lip & Cheek Tint"/>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Emoji</label>
          <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]" placeholder="💄"/>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Price (Rs.) *</label>
          <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]"/>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Original Price (optional)</label>
          <input type="number" value={form.originalPrice ?? ""} onChange={e => setForm(f => ({ ...f, originalPrice: Number(e.target.value) || undefined }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]" placeholder="Strike-through price"/>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c]">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${form.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {form.active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
            {form.active ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e91e8c] resize-none" placeholder="Short product description..."/>
      </div>

      {/* Shades */}
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-2 block">Shades / Variants (optional)</label>
        {form.shades && form.shades.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {form.shades.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-pink-50 rounded-full px-2.5 py-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.hex }}/>
                {s.name}
                <button onClick={() => removeShade(i)} className="text-gray-400 hover:text-red-500 ml-0.5"><X size={10}/></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input value={shadeInput.name} onChange={e => setShadeInput(s => ({ ...s, name: e.target.value }))}
            placeholder="Shade name" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#e91e8c]"/>
          <input type="color" value={shadeInput.hex} onChange={e => setShadeInput(s => ({ ...s, hex: e.target.value }))}
            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer"/>
          <button onClick={addShade} className="bg-pink-100 text-[#e91e8c] px-3 py-2 rounded-xl text-xs font-bold hover:bg-pink-200">
            <Plus size={14}/>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={submit} className="flex items-center gap-1.5 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90">
          <Save size={14}/> Save Product
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}

function BundleForm({ initial, onSave, onCancel }: {
  initial?: Partial<Bundle>;
  onSave: (b: Bundle) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Bundle>>({
    name: "", description: "", price: 0, items: "", active: true, emoji: "🎁",
    ...initial
  });

  function submit() {
    if (!form.name || !form.price) return;
    onSave({
      id: form.id ?? `b${Date.now()}`,
      name: form.name!,
      description: form.description ?? "",
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      items: form.items ?? "",
      active: form.active ?? true,
      emoji: form.emoji ?? "🎁",
      badge: form.badge,
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-purple-400 p-5 space-y-4">
      <h3 className="font-bold text-purple-700">{form.id ? "Edit Bundle" : "New Bundle"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "Bundle Name *", key: "name", placeholder: "e.g. Glow Bundle" },
          { label: "Emoji", key: "emoji", placeholder: "🎁" },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
            <input value={(form as any)[f.key] ?? ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder={f.placeholder}/>
          </div>
        ))}
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Price (Rs.) *</label>
          <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"/>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Original Price</label>
          <input type="number" value={form.originalPrice ?? ""} onChange={e => setForm(f => ({ ...f, originalPrice: Number(e.target.value) || undefined }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400"/>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Badge (optional)</label>
          <input value={form.badge ?? ""} onChange={e => setForm(f => ({ ...f, badge: e.target.value || undefined }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="e.g. Best Seller"/>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl ${form.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {form.active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
            {form.active ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Includes (products in bundle)</label>
        <input value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="e.g. Tint + Serum + Mask"/>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="Short tagline..."/>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={submit} className="flex items-center gap-1.5 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700">
          <Save size={14}/> Save Bundle
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [tab, setTab] = useState<"products" | "bundles">("products");
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [bundles, setBundles] = useState<Bundle[]>(DEFAULT_BUNDLES);
  const [editingProduct, setEditingProduct] = useState<Product | null | "new">(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null | "new">(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function saveProduct(p: Product) {
    setProducts(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = p; return n; }
      return [p, ...prev];
    });
    setEditingProduct(null);
  }

  function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  function toggleProduct(id: string) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }

  function saveBundle(b: Bundle) {
    setBundles(prev => {
      const idx = prev.findIndex(x => x.id === b.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = b; return n; }
      return [b, ...prev];
    });
    setEditingBundle(null);
  }

  function deleteBundle(id: string) {
    if (!confirm("Delete this bundle?")) return;
    setBundles(prev => prev.filter(b => b.id !== id));
  }

  function toggleBundle(id: string) {
    setBundles(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Products & Bundles</h1>
          <p className="text-sm text-gray-400">Manage your catalogue</p>
        </div>
        <button
          onClick={() => tab === "products" ? setEditingProduct("new") : setEditingBundle("new")}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-4 py-2 rounded-full text-sm font-bold hover:opacity-90">
          <Plus size={14}/> Add {tab === "products" ? "Product" : "Bundle"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-full text-sm font-bold ${tab === "products" ? "bg-[#e91e8c] text-white shadow" : "bg-white text-gray-600 border border-gray-200"}`}>
          <span className="flex items-center gap-1.5"><Tag size={14}/> Products ({products.length})</span>
        </button>
        <button onClick={() => setTab("bundles")}
          className={`px-4 py-2 rounded-full text-sm font-bold ${tab === "bundles" ? "bg-[#e91e8c] text-white shadow" : "bg-white text-gray-600 border border-gray-200"}`}>
          <span className="flex items-center gap-1.5"><Gift size={14}/> Bundles ({bundles.length})</span>
        </button>
      </div>

      {/* Form */}
      {tab === "products" && editingProduct && (
        <div className="mb-5">
          <ProductForm
            initial={editingProduct === "new" ? undefined : editingProduct}
            onSave={saveProduct}
            onCancel={() => setEditingProduct(null)}
          />
        </div>
      )}

      {tab === "bundles" && editingBundle && (
        <div className="mb-5">
          <BundleForm
            initial={editingBundle === "new" ? undefined : editingBundle}
            onSave={saveBundle}
            onCancel={() => setEditingBundle(null)}
          />
        </div>
      )}

      {/* Products Grid */}
      {tab === "products" && (
        <div className="space-y-3">
          {products.map(p => {
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${!p.active ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3 p-4">
                  <div className="text-3xl">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{p.name}</span>
                      {!p.active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                    </div>
                    <div className="text-xs text-gray-400">{p.category}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-black text-[#8b0057] text-sm">Rs. {p.price.toLocaleString()}</span>
                      {p.originalPrice && <span className="text-xs line-through text-gray-400">Rs. {p.originalPrice.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleProduct(p.id)} className={`p-1.5 rounded-lg ${p.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}>
                      {p.active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                    </button>
                    <button onClick={() => setEditingProduct(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                      <Edit2 size={15}/>
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                      <Trash2 size={15}/>
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : p.id)} className="p-1.5 text-gray-400">
                      {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-50 p-4 space-y-3">
                    <p className="text-sm text-gray-600">{p.description}</p>
                    {p.shades.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2">Shades</p>
                        <div className="flex flex-wrap gap-3">
                          {p.shades.map((s, i) => <ColorSwatch key={i} hex={s.hex} name={s.name}/>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {products.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-40"/>
              <p>No products yet. Add your first product!</p>
            </div>
          )}
        </div>
      )}

      {/* Bundles Grid */}
      {tab === "bundles" && (
        <div className="space-y-3">
          {bundles.map(b => (
            <div key={b.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${!b.active ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{b.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-800">{b.name}</span>
                    {b.badge && <span className="text-[10px] bg-pink-100 text-[#e91e8c] px-2 py-0.5 rounded-full font-bold">{b.badge}</span>}
                    {!b.active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{b.items}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-black text-[#8b0057] text-sm">Rs. {b.price.toLocaleString()}</span>
                    {b.originalPrice && <span className="text-xs line-through text-gray-400">Rs. {b.originalPrice.toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleBundle(b.id)} className={`p-1.5 rounded-lg ${b.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}>
                    {b.active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                  </button>
                  <button onClick={() => setEditingBundle(b)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                    <Edit2 size={15}/>
                  </button>
                  <button onClick={() => deleteBundle(b.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {bundles.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
              <Gift size={32} className="mx-auto mb-2 opacity-40"/>
              <p>No bundles yet. Create your first bundle!</p>
            </div>
          )}
        </div>
      )}

      {/* Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm">
        <p className="font-bold text-blue-800 mb-1">💡 Local changes only</p>
        <p className="text-blue-700 text-xs">Changes here are saved in browser memory. Once Firebase is configured in <code className="bg-blue-100 px-1 rounded">.env.local</code>, products will persist in Firestore and sync to the customer ordering page automatically.</p>
      </div>
    </div>
  );
}
