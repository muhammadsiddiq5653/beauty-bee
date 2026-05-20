import Link from "next/link";
import { Gift } from "lucide-react";
import BundleDetailClient from "@/components/BundleDetailClient";
import { getCachedBundle, getCachedShopData } from "@/lib/shopData";

export const revalidate = 300;

export default async function BundleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ settings }, bundle] = await Promise.all([
    getCachedShopData(),
    getCachedBundle(id),
  ]);

  if (!bundle) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center gap-4 p-6">
        <Gift size={48} className="text-gray-300" />
        <p className="text-gray-500 font-semibold">Bundle not found</p>
        <Link href="/shop" className="text-[#e91e8c] font-bold text-sm underline">Back to Shop</Link>
      </div>
    );
  }

  return <BundleDetailClient bundle={bundle} deliveryCharge={settings.deliveryCharge} />;
}

