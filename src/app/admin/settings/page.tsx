"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, RefreshCw, CheckCircle, AlertCircle,
  Truck, MessageCircle, Gift
} from "lucide-react";
import { getStoreSettings, updateStoreSettings, type StoreSettings } from "@/lib/firestore";

const inputClass =
  "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#9B2B47] transition-colors bg-white";
const labelClass = "text-xs font-bold text-gray-600 block mb-1.5";

export default function SettingsPage() {
  const [form, setForm] = useState<StoreSettings>({
    deliveryCharge: 200,
    freeDeliveryThreshold: 0,
    whatsappNumber: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const s = await getStoreSettings();
      setForm(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (form.deliveryCharge < 0) { setError("Delivery charge cannot be negative"); return; }
    setSaving(true);
    setError("");
    try {
      await updateStoreSettings(form);
      setSuccess("Settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function field(
    label: string,
    key: keyof StoreSettings,
    opts: { type?: string; placeholder?: string; hint?: string; prefix?: string; suffix?: string }
  ) {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <div className="relative flex items-center">
          {opts.prefix && (
            <span className="absolute left-3 text-sm font-bold text-gray-400 pointer-events-none select-none">
              {opts.prefix}
            </span>
          )}
          <input
            type={opts.type ?? "text"}
            value={form[key] as string | number}
            onChange={e =>
              setForm(f => ({
                ...f,
                [key]: opts.type === "number" ? Number(e.target.value) || 0 : e.target.value,
              }))
            }
            placeholder={opts.placeholder}
            className={`${inputClass} ${opts.prefix ? "pl-10" : ""} ${opts.suffix ? "pr-14" : ""}`}
          />
          {opts.suffix && (
            <span className="absolute right-3 text-xs font-bold text-gray-400 pointer-events-none select-none">
              {opts.suffix}
            </span>
          )}
        </div>
        {opts.hint && <p className="text-[11px] text-gray-400 mt-1">{opts.hint}</p>}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Settings size={22} className="text-[#9B2B47]" />
            Store Settings
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : "Configure delivery, WhatsApp, and store behaviour"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

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

      {!loading && (
        <div className="space-y-5">
          {/* Delivery */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={15} className="text-[#9B2B47]" />
              <span className="text-xs font-black text-[#9B2B47] uppercase tracking-wide">Delivery</span>
            </div>

            {field("Delivery Charge (Rs.)", "deliveryCharge", {
              type: "number",
              prefix: "Rs.",
              placeholder: "200",
              hint: "Flat rate charged on every order at checkout.",
            })}

            {field("Free Delivery Threshold (Rs.)", "freeDeliveryThreshold", {
              type: "number",
              prefix: "Rs.",
              placeholder: "0",
              hint: "Orders above this amount get free delivery. Set 0 to disable.",
            })}

            {/* Live preview */}
            <div className="bg-[#FAF7F4] rounded-xl px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Delivery charge</span>
                <span className="font-bold text-[#9B2B47]">Rs. {form.deliveryCharge.toLocaleString()}</span>
              </div>
              {form.freeDeliveryThreshold > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1"><Gift size={12} /> Free delivery above</span>
                  <span className="font-bold text-green-600">Rs. {form.freeDeliveryThreshold.toLocaleString()}</span>
                </div>
              )}
            </div>
          </section>

          {/* WhatsApp */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={15} className="text-green-600" />
              <span className="text-xs font-black text-green-700 uppercase tracking-wide">WhatsApp</span>
            </div>

            {field("WhatsApp Number", "whatsappNumber", {
              placeholder: "923001234567",
              hint: "Full international format without + (e.g. 923001234567). Used in order confirmation links.",
            })}
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#9B2B47] hover:bg-[#7D1E35] text-white font-bold py-3 rounded-2xl text-sm shadow disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {saving
              ? <><RefreshCw size={15} className="animate-spin" /> Saving…</>
              : <><Save size={15} /> Save Settings</>}
          </button>
        </div>
      )}
    </div>
  );
}
