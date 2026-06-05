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
      <div className="bb-page">
        <div className="bb-mesh" aria-hidden="true"><span /><span /><span /></div>
        <StoreNav />
        <CartDrawer initialDelivery={settings.deliveryCharge} />
        <div className="bb-shell grid min-h-[70svh] place-items-center px-5 text-center">
          <div className="bb-glass rounded-[28px] p-8">
            <Package size={48} className="mx-auto mb-4 text-[var(--bb-berry)]" />
            <h1 className="bb-serif text-4xl text-[var(--bb-ink)]">Product not found</h1>
            <Link href="/shop" className="bb-btn bb-btn-primary mt-6">Back to Shop</Link>
          </div>
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
