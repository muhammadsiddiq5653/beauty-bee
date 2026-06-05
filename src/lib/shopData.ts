import { unstable_cache } from "next/cache";
import { DEFAULT_SETTINGS, getBundles, getProducts, getStoreSettings } from "@/lib/firestore";
import type { Bundle, Product } from "@/types";

export const getCachedShopData = unstable_cache(
  async () => {
    try {
      const [products, bundles, settings] = await Promise.all([
        getProducts(),
        getBundles(),
        getStoreSettings(),
      ]);
      const activeProducts = products.filter(p => p.active !== false);
      const activeBundles = bundles.filter(b => b.active !== false);

      return {
        products: activeProducts,
        bundles: activeBundles,
        settings,
      };
    } catch {
      return {
        products: [],
        bundles: [],
        settings: DEFAULT_SETTINGS,
      };
    }
  },
  ["beauty-bee-shop-data"],
  { revalidate: 300, tags: ["shop-data"] }
);

export async function getCachedProduct(id: string): Promise<Product | null> {
  const { products } = await getCachedShopData();
  return products.find(product => product.id === id && product.active !== false) ?? null;
}

export async function getCachedBundle(id: string): Promise<Bundle | null> {
  const { bundles } = await getCachedShopData();
  return bundles.find(bundle => bundle.id === id && bundle.active !== false) ?? null;
}

export async function getProductSuggestions(currentProductId: string): Promise<Product[]> {
  const { products } = await getCachedShopData();
  return products.filter(product => product.id !== currentProductId && product.active !== false).slice(0, 2);
}
