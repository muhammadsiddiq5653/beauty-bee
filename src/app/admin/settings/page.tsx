"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Save, RefreshCw, CheckCircle, AlertCircle,
  Truck, MessageCircle, Gift, ImageIcon, Trash2, ArrowDown, ArrowUp
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { getStoreSettings, updateStoreSettings, type MarketingBanner, type StoreSettings } from "@/lib/firestore";

const inputClass =
  "w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#9B2B47] transition-colors bg-white";
const labelClass = "text-xs font-bold text-gray-600 block mb-1.5";
const sectionTypes: Array<{ value: NonNullable<MarketingBanner["type"]>; label: string }> = [
  { value: "announcement", label: "Top announcement" },
  { value: "hero", label: "Hero" },
  { value: "promo", label: "Promo banner" },
  { value: "trust", label: "Trust strip" },
  { value: "products", label: "Products" },
  { value: "bundles", label: "Bundles" },
  { value: "ingredients", label: "Ingredients block" },
  { value: "reviews", label: "Reviews" },
  { value: "trackLink", label: "Footer/track link" },
];

function defaultPlacement(type: MarketingBanner["type"]): MarketingBanner["placement"] {
  if (type === "announcement") return "top";
  if (type === "hero") return "hero";
  if (type === "trackLink") return "bottom";
  return "middle";
}

export default function SettingsPage() {
  const [form, setForm] = useState<StoreSettings>({
    deliveryCharge: 200,
    freeDeliveryThreshold: 0,
    whatsappNumber: "",
    banners: [],
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
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        const res = await fetch("/api/admin/revalidate", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error("Settings saved, but cache refresh failed");
      }
      setSuccess("Settings saved and storefront refreshed!");
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

  function updateBanner(id: string, data: Partial<MarketingBanner>) {
    setForm(f => ({
      ...f,
      banners: f.banners.map(banner => (banner.id === id ? { ...banner, ...data } : banner)),
    }));
  }

  function addBanner(type: NonNullable<MarketingBanner["type"]> = "promo") {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `banner-${Date.now()}`;
    setForm(f => ({
      ...f,
      banners: [
        ...f.banners,
        {
          id,
          type,
          placement: defaultPlacement(type),
          active: true,
          sortOrder: f.banners.length * 10 + 10,
          eyebrow: "New Offer",
          title: type === "products" ? "Featured Products" : type === "hero" ? "Campaign Hero" : "Limited Time Deal",
          body: "Update this banner from admin settings.",
          buttonLabel: "Shop Now",
          href: "#products",
        },
      ],
    }));
  }

  function removeBanner(id: string) {
    setForm(f => ({ ...f, banners: f.banners.filter(banner => banner.id !== id) }));
  }

  function moveBanner(id: string, direction: -1 | 1) {
    setForm(f => {
      const banners = [...f.banners].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const index = banners.findIndex(banner => banner.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= banners.length) return f;
      [banners[index], banners[target]] = [banners[target], banners[index]];
      return {
        ...f,
        banners: banners.map((banner, i) => ({ ...banner, sortOrder: (i + 1) * 10 })),
      };
    });
  }

  function bannerInput(
    banner: MarketingBanner,
    key: keyof MarketingBanner,
    placeholder: string,
    type = "text"
  ) {
    return (
      <input
        type={type}
        value={(banner[key] as string | undefined) ?? ""}
        onChange={e => updateBanner(banner.id, { [key]: e.target.value })}
        placeholder={placeholder}
        className={inputClass}
      />
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

          {/* Homepage builder */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={15} className="text-[#9B2B47]" />
                <span className="text-xs font-black text-[#9B2B47] uppercase tracking-wide">Homepage Builder</span>
              </div>
              <select
                onChange={e => {
                  if (!e.target.value) return;
                  addBanner(e.target.value as NonNullable<MarketingBanner["type"]>);
                  e.target.value = "";
                }}
                defaultValue=""
                className="border border-gray-100 rounded-full px-3 py-1.5 text-xs font-bold bg-[#9B2B47] text-white"
              >
                <option value="" disabled>Add section</option>
                {sectionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>

            <p className="text-[11px] text-gray-400">
              Add, hide, reorder, and edit homepage sections. Image and video URLs work for hero and promo sections.
            </p>

            {form.banners.length === 0 && (
              <div className="bg-[#FAF7F4] rounded-xl px-4 py-3 text-xs text-gray-500">
                No banners configured. Add one to show campaign content on the storefront.
              </div>
            )}

            <div className="space-y-4">
              {[...form.banners].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((banner, index) => (
                <div key={banner.id} className="rounded-2xl border border-gray-100 bg-[#FAF7F4] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="checkbox"
                        checked={banner.active}
                        onChange={e => updateBanner(banner.id, { active: e.target.checked })}
                        className="h-4 w-4 accent-[#9B2B47]"
                      />
                      <span className="text-[11px] font-black text-gray-400 w-7">#{index + 1}</span>
                      <select
                        value={banner.type ?? "promo"}
                        onChange={e => {
                          const type = e.target.value as NonNullable<MarketingBanner["type"]>;
                          updateBanner(banner.id, { type, placement: defaultPlacement(type) });
                        }}
                        className="border border-gray-100 rounded-full px-3 py-1.5 text-xs font-bold bg-white text-gray-600"
                      >
                        {sectionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                      <select
                        value={banner.placement}
                        onChange={e => updateBanner(banner.id, { placement: e.target.value as MarketingBanner["placement"] })}
                        className="border border-gray-100 rounded-full px-3 py-1.5 text-xs font-bold bg-white text-gray-600"
                      >
                        <option value="top">Top strip</option>
                        <option value="hero">Hero</option>
                        <option value="middle">Middle promo</option>
                        <option value="bottom">Bottom promo</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBanner(banner.id, -1)}
                        disabled={index === 0}
                        className="p-2 rounded-full text-gray-500 hover:bg-white disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBanner(banner.id, 1)}
                        disabled={index === form.banners.length - 1}
                        className="p-2 rounded-full text-gray-500 hover:bg-white disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBanner(banner.id)}
                        className="p-2 rounded-full text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Eyebrow</label>
                      {bannerInput(banner, "eyebrow", "New Arrival")}
                    </div>
                    <div>
                      <label className={labelClass}>Title</label>
                      {bannerInput(banner, "title", "Buy 2 Get 1 Free")}
                    </div>
                    <div>
                      <label className={labelClass}>Highlight</label>
                      {bannerInput(banner, "highlight", "Limited Time")}
                    </div>
                    <div>
                      <label className={labelClass}>Button Label</label>
                      {bannerInput(banner, "buttonLabel", "Shop Now")}
                    </div>
                    <div>
                      <label className={labelClass}>Button Link</label>
                      {bannerInput(banner, "href", "#products")}
                    </div>
                    <div>
                      <label className={labelClass}>Image URL</label>
                      {bannerInput(banner, "imageUrl", "https://...")}
                    </div>
                    <div>
                      <label className={labelClass}>Video URL</label>
                      {bannerInput(banner, "videoUrl", "https://...mp4")}
                    </div>
                    <div>
                      <label className={labelClass}>Background Color</label>
                      {bannerInput(banner, "backgroundColor", "#F2EDE8", "color")}
                    </div>
                    <div>
                      <label className={labelClass}>Text Color</label>
                      {bannerInput(banner, "textColor", "#1A1A1A", "color")}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Body</label>
                    <textarea
                      value={banner.body ?? ""}
                      onChange={e => updateBanner(banner.id, { body: e.target.value })}
                      placeholder="Short promo copy"
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
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
