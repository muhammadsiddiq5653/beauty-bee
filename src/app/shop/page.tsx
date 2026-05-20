import ShopClient from "@/components/ShopClient";
import { getCachedShopData } from "@/lib/shopData";

export const revalidate = 300;

export default async function ShopPage() {
  const { products, bundles, settings } = await getCachedShopData();

  return (
    <ShopClient
      products={products}
      bundles={bundles}
      settings={settings}
    />
  );
}
