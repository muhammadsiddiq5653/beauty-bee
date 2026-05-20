import Link from "next/link";
import { Package } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import ProductDetailClient from "@/components/ProductDetailClient";
import StoreNav from "@/components/StoreNav";
import { getCachedProduct, getCachedShopData, getProductSuggestions } from "@/lib/shopData";

export const revalidate = 300;

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ settings }, product, suggestions] = await Promise.all([
    getCachedShopData(),
    getCachedProduct(id),
    getProductSuggestions(id),
  ]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF7F4]">
        <StoreNav />
        <CartDrawer initialDelivery={settings.deliveryCharge} />
        <div className="max-w-lg mx-auto px-5 py-20 text-center">
          <Package size={48} className="text-[#EDE8E4] mx-auto mb-4" />
          <h1 className="font-serif font-bold text-xl text-[#1A1A1A] mb-2">Product not found</h1>
          <Link href="/shop" className="text-[#9B2B47] font-medium hover:underline text-sm">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <ProductDetailClient
      product={product}
      suggestions={suggestions}
      deliveryCharge={settings.deliveryCharge}
    />
  );
}

