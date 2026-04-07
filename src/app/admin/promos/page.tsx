"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight,
  RefreshCw, Copy, CheckCircle, AlertCircle, Percent, DollarSign
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";

interface PromoCode {
  id: string;          // Firestore doc id = code string (uppercase)
  code: string;
  type: "percent" | "fixed";
  value: number;       // percent (0-100) or fixed Rs. amount
  minOrder?: number;   // minimum order value to apply
  maxUses?: number;    // 0 = unlimited
  usedCount: number;
  active: boolean;
  label?: string;      // friendly name shown to customer e.g. "10% off"
  expiresAt?: string;  // ISO date string
  createdAt?: string;
}

const DEFAULT_CODES: PromoCode[] = [
  { id: "BEAUTY10",  code: "BEAUTY10",  type: "percent", value: 10,  minOrder: 0,    maxUses: 0, usedCount: 0, active: true, label: "10% off everything"   },
  { id: "WELCOME50", code: "WELCOME50", type: "fixed",   value: 50,  minOrder: 500,  maxUses: 0, usedCount: 0, active: true, label: "Rs. 50 off (min Rs. 500)" },
  { id: "GLOW100",   code: "GLOW100",   type: "fixed",   value: 100, minOrder: 1000, maxUses: 0, usedCount: 0, active: true, label: "Rs. 100 off (min Rs. 1,000)" },
  { id: "BEE20",     code: "BEE20",     type: "percent", value: 20,  minOrder: 1500, maxUses: 0, usedCount: 0, active: true, label: "20% off (min Rs. 1,500)" },
];

const EMPTY_FORM: Omit<PromoCode, "id" | "usedCount" | "createdAt"> = {
  code: "",
  type: "percent",
  value: 10,
  minOrder: 0,
  maxUses: 0,
  active: true,
  label: "",
  expiresAt: "",
};

async function loadCodes(): Promise<PromoCode[]> {
  const snap = await getDocs(collection(db, "promoCodes"));
  if (snap.empty) return DEFAULT_CODES;
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PromoCode));
}

async function saveCode(code: PromoCode) {
  await setDoc(doc(db, "promoCodes", code.code.toUpperCase()), {
    ...code,
    code: code.code.toUpperCase(),
    updatedAt: serverTimestamp(),
    createdAt: code.createdAt ?? new Date().toISOString(),
  });
}

async function toggleCode(code: PromoCode, active: boolean) {
  await updateDoc(doc(db, "promoCodes", code.id), { active, updatedAt: serverTimestamp() });
}

async function removeCode(id: string) {
  await deleteDoc(doc(db, "promoCodes", id));
}

function CodeBadge({ type, value }: { type: "percent" | "fixed"; value: number }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${type === "percent" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
      {type === "percent" ? <Percent size={10} /> : <DollarSign size={10} />}
      {type === "percent" ? `${value}% OFF` : `Rs. ${value} OFF`}
    </span>
  );
}

export default function PromosPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCodes(await loadCodes());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(c: PromoCode) {
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder ?? 0,
      maxUses: c.maxUses ?? 0,
      active: c.active,
      label: c.label ?? "",
      expiresAt: c.expiresAt ?? "",
    });
    setEditId(c.id);
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    if (!form.code.trim()) { setError("Code is required"); return; }
    if (form.value <= 0) { setError("Value must be greater than 0"); return; }
    if (form.type === "percent" && form.value > 100) { setError("Percent cannot exceed 100"); return; }

    const isDuplicate = codes.some(c => c.code === form.code.toUpperCase() && c.id !== editId);
    if (isDuplicate) { setError("A code with this name already exists"); return; }

    setSaving(true);
    setError("");
    try {
      const existing = editId ? codes.find(c => c.id === editId) : null;
      const newCode: PromoCode = {
        id: form.code.toUpperCase(),
        code: form.code.toUpperCase(),
        type: form.type,
        value: form.value,
        minOrder: form.minOrder ?? 0,
        maxUses: form.maxUses ?? 0,
        usedCount: existing?.usedCount ?? 0,
        active: form.active,
        label: form.label || (form.type === "percent" ? `${form.value}% off` : `Rs. ${form.value} off`),
        expiresAt: form.expiresAt || undefined,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };

      // If editing and code changed, remove old doc
      if (editId && editId !== newCode.id) {
        await removeCode(editId);
      }

      await saveCode(newCode);
      await load();
      setShowForm(false);
      flash(editId ? "Promo code updated!" : "Promo code created!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(c: PromoCode) {
    try {
      await toggleCode(c, !c.active);
      await load();
      flash(`${c.code} ${!c.active ? "activated" : "deactivated"}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeCode(id);
      await load();
      setConfirmDelete(null);
      flash("Promo code deleted");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function seedDefaults() {
    setSaving(true);
    try {
      for (const c of DEFAULT_CODES) await saveCode(c);
      await load();
      flash("Default codes seeded!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSaving(false);
    }
  }

  const activeCodes = codes.filter(c => c.active);
  const inactiveCodes = codes.filter(c => !c.active);

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Tag size={22} className="text-[#e91e8c]" />
            Promo Codes
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading..." : `${activeCodes.length} active · ${inactiveCodes.length} inactive`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white px-4 py-2 rounded-full font-bold text-sm shadow hover:opacity-90 transition-opacity">
            <Plus size={16} /> New Code
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <CheckCircle size={16} className="flex-shrink-0" /> {success}
        </div>
      )}

      {/* New / Edit Form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100 flex items-center justify-between">
            <h2 className="font-black text-[#8b0057]">{editId ? "Edit Promo Code" : "New Promo Code"}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Code <span className="text-red-400">*</span></label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER20"
                disabled={!!editId}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-[#8b0057] focus:outline-none focus:border-[#e91e8c] disabled:bg-gray-50"
              />
            </div>

            {/* Label */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Display Label</label>
              <input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Summer Sale 20% off"
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e91e8c]"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Discount Type <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {[
                  { val: "percent", label: "% Percent", icon: <Percent size={13} /> },
                  { val: "fixed",   label: "Rs. Fixed",  icon: <DollarSign size={13} /> },
                ].map(t => (
                  <button key={t.val} onClick={() => setForm(f => ({ ...f, type: t.val as "percent" | "fixed" }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.type === t.val ? "border-[#e91e8c] bg-pink-50 text-[#8b0057]" : "border-gray-100 text-gray-500 hover:border-pink-200"}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">
                {form.type === "percent" ? "Discount %" : "Discount Amount (Rs.)"} <span className="text-red-400">*</span>
              </label>
              <input
                type="number" min="1" max={form.type === "percent" ? 100 : undefined}
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold text-[#8b0057] focus:outline-none focus:border-[#e91e8c]"
              />
            </div>

            {/* Min Order */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Min Order Value (Rs.)</label>
              <input
                type="number" min="0"
                value={form.minOrder ?? 0}
                onChange={e => setForm(f => ({ ...f, minOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0 = no minimum"
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e91e8c]"
              />
            </div>

            {/* Max Uses */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Max Uses (0 = unlimited)</label>
              <input
                type="number" min="0"
                value={form.maxUses ?? 0}
                onChange={e => setForm(f => ({ ...f, maxUses: parseInt(e.target.value) || 0 }))}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e91e8c]"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Expiry Date (optional)</label>
              <input
                type="date"
                value={form.expiresAt ?? ""}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e91e8c]"
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-bold text-gray-600">Active</label>
              <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`w-11 h-6 rounded-full relative transition-colors ${form.active ? "bg-green-500" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
              </button>
              <span className={`text-xs font-semibold ${form.active ? "text-green-600" : "text-gray-400"}`}>
                {form.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Preview */}
          {form.code && form.value > 0 && (
            <div className="px-5 pb-2">
              <div className="bg-pink-50 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500">Preview:</span>
                <CodeBadge type={form.type} value={form.value} />
                <span className="font-mono text-xs font-black text-[#8b0057]">{form.code || "CODE"}</span>
                {form.minOrder ? <span className="text-[10px] text-gray-400">min Rs. {form.minOrder.toLocaleString()}</span> : null}
              </div>
            </div>
          )}

          {error && (
            <div className="px-5 pb-2">
              <p className="text-xs text-red-500 font-semibold">{error}</p>
            </div>
          )}

          <div className="px-5 pb-5 flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#8b0057] to-[#e91e8c] text-white font-black py-3 rounded-xl text-sm shadow disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><CheckCircle size={14} /> {editId ? "Update Code" : "Create Code"}</>}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-semibold text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state with seed option */}
      {!loading && codes.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-6">
          <Tag size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-600 mb-1">No promo codes yet</p>
          <p className="text-sm text-gray-400 mb-4">Create your first code or seed the defaults.</p>
          <button onClick={seedDefaults} disabled={saving}
            className="bg-pink-50 text-[#e91e8c] font-bold px-5 py-2 rounded-full text-sm border border-pink-200 hover:bg-pink-100 transition-colors disabled:opacity-60">
            {saving ? "Seeding..." : "Seed Default Codes"}
          </button>
        </div>
      )}

      {/* Active codes */}
      {activeCodes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Active Codes ({activeCodes.length})</h3>
          <div className="space-y-2">
            {activeCodes.map(c => <CodeRow key={c.id} code={c} onEdit={() => openEdit(c)} onToggle={() => handleToggle(c)} onDelete={() => setConfirmDelete(c.id)} onCopy={() => copyCode(c.code)} copied={copied === c.code} confirmDelete={confirmDelete === c.id} onConfirmDelete={() => handleDelete(c.id)} onCancelDelete={() => setConfirmDelete(null)} />)}
          </div>
        </div>
      )}

      {/* Inactive codes */}
      {inactiveCodes.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Inactive Codes ({inactiveCodes.length})</h3>
          <div className="space-y-2">
            {inactiveCodes.map(c => <CodeRow key={c.id} code={c} onEdit={() => openEdit(c)} onToggle={() => handleToggle(c)} onDelete={() => setConfirmDelete(c.id)} onCopy={() => copyCode(c.code)} copied={copied === c.code} confirmDelete={confirmDelete === c.id} onConfirmDelete={() => handleDelete(c.id)} onCancelDelete={() => setConfirmDelete(null)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function CodeRow({
  code, onEdit, onToggle, onDelete, onCopy, copied, confirmDelete, onConfirmDelete, onCancelDelete
}: {
  code: PromoCode;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onCopy: () => void;
  copied: boolean;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const isExpired = code.expiresAt ? new Date(code.expiresAt) < new Date() : false;
  const usagePct = code.maxUses ? Math.min(100, Math.round((code.usedCount / code.maxUses) * 100)) : null;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${code.active && !isExpired ? "border-pink-50" : "border-gray-100 opacity-70"}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Code & badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-[#8b0057] text-base">{code.code}</span>
              <CodeBadge type={code.type} value={code.value} />
              {isExpired && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">EXPIRED</span>}
              {!code.active && !isExpired && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">INACTIVE</span>}
            </div>
            {code.label && <p className="text-xs text-gray-500 mt-0.5">{code.label}</p>}
            <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-gray-400">
              {(code.minOrder ?? 0) > 0 && <span>Min Rs. {code.minOrder?.toLocaleString()}</span>}
              <span>{code.usedCount} uses{code.maxUses ? ` / ${code.maxUses} max` : ""}</span>
              {code.expiresAt && <span>Expires {new Date(code.expiresAt).toLocaleDateString("en-PK")}</span>}
            </div>
            {usagePct !== null && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-32">
                <div className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-red-400" : usagePct >= 60 ? "bg-amber-400" : "bg-green-400"}`}
                  style={{ width: `${usagePct}%` }} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onCopy} title="Copy code"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              {copied ? <CheckCircle size={15} className="text-green-500" /> : <Copy size={15} />}
            </button>
            <button onClick={onToggle} title={code.active ? "Deactivate" : "Activate"}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100">
              {code.active
                ? <ToggleRight size={20} className="text-green-500" />
                : <ToggleLeft size={20} className="text-gray-400" />}
            </button>
            <button onClick={onEdit} title="Edit"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#e91e8c] hover:bg-pink-50 transition-colors text-xs font-bold">
              ✎
            </button>
            <button onClick={onDelete} title="Delete"
              className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <span className="text-xs text-red-600 font-semibold flex-1">Delete <strong>{code.code}</strong>? This cannot be undone.</span>
            <button onClick={onConfirmDelete} className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-bold hover:bg-red-600">Delete</button>
            <button onClick={onCancelDelete} className="text-xs text-gray-500 font-semibold hover:text-gray-700">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
