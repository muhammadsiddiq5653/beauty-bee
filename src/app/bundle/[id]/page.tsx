import Link from "next/link";
import { Gift } from "lucide-react";
import BundleDetailClient from "@/components/BundleDetailClient";
import { getCachedBundle, getCachedShopData } from "@/lib/shopData";
import type { Shade, Product } from "@/types";

export const revalidate = 300;

export default async function BundleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ settings, products }, bundle] = await Promise.all([
    getCachedShopData(),
    getCachedBundle(id),
  ]);

  if (!bundle) {
    return (
      <div className="bb-page grid min-h-screen place-items-center p-6 text-center">
        <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>
        <div className="bb-glass rounded-[28px] p-8">
          <Gift size={48} className="mx-auto text-[var(--bb-berry)]" />
          <p className="bb-serif mt-4 text-4xl text-[var(--bb-ink)]">Bundle not found</p>
          <Link href="/shop" className="bb-btn bb-btn-primary mt-6">Back to Shop</Link>
        </div>
      </div>
    );
  }

  // Shade selection: driven by bundle.shadeSlotCount (set in admin).
  // Shade options come from all active products that require a shade.
  const shadeSlotCount = bundle.shadeSlotCount ?? 0;
  const shadeOptions: Shade[] = [];
  if (shadeSlotCount > 0) {
    const seen = new Set<string>();
    for (const p of products as Product[]) {
      if (!p.needsShade || p.active === false) continue;
      for (const s of p.shades) {
        if (!seen.has(s.name)) {
          seen.add(s.name);
          shadeOptions.push(s);
        }
      }
    }
  }

  return (
    <BundleDetailClient
      bundle={bundle}
      deliveryCharge={settings.deliveryCharge}
      shadeOptions={shadeOptions}
      shadeSlotCount={shadeSlotCount}
    />
  );
}
