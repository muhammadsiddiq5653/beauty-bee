import { unstable_cache } from "next/cache";
import { DEFAULT_SETTINGS, getBundles, getProducts, getStoreSettings } from "@/lib/firestore";
import { DEFAULT_BUNDLES, DEFAULT_PRODUCTS } from "@/lib/catalogue";
import type { Bundle, Product } from "@/types";

const PRODUCT_IDS = ["tint", "mask", "serum", "soap"];
const BUNDLE_IDS = ["starter", "glow", "complete", "duo"];

function fallbackProducts(): Product[] {
  return DEFAULT_PRODUCTS.map((p, i) => ({ ...p, id: PRODUCT_IDS[i] })) as Product[];
}

function fallbackBundles(): Bundle[] {
  return DEFAULT_BUNDLES.map((b, i) => ({ ...b, id: BUNDLE_IDS[i] })) as Bundle[];
}

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
        products: activeProducts.length > 0 ? activeProducts : fallbackProducts(),
        bundles: activeBundles,
        settings,
      };
    } catch {
      return {
        products: fallbackProducts(),
        bundles: fallbackBundles(),
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
