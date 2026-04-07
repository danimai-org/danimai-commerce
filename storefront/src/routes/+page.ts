import type { ProductGridItem } from "./store/+page.ts";
import { API_BASE } from "$lib/api/storefront-api";

type ApiVariant = {
  id: string;
  prices?: Array<{ amount: string; currency_code: string }>;
};

const FALLBACK_BGS = ["#e8e0d5", "#4a4a4a", "#f5f0eb", "#6b7c5c"];

function pickBg(index: number): string {
  return FALLBACK_BGS[index % FALLBACK_BGS.length];
}

async function fetchVariantPrice(
  apiBase: string,
  variantId: string,
): Promise<{ amount: number; currency_code: string } | null> {
  try {
    const res = await fetch(`${apiBase}/product-variants/${variantId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ApiVariant;
    const prices = data.prices ?? [];
    if (prices.length === 0) return null;
    const p = prices[0];
    const amount = parseInt(p.amount, 10) / 100;
    return { amount, currency_code: p.currency_code };
  } catch {
    return null;
  }
}

export async function load() {
  const products: ProductGridItem[] = [];
  let error: string | null = null;

  try {
    const params = new URLSearchParams({ limit: "8", page: "1" });
    const res = await fetch(`${API_BASE}/products?${params}`, {
      cache: "no-store",
    });
    const data = await res.json();
    const { rows: list } = data;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      let priceStr = "—";
      if (p.variants?.[0]?.id) {
        const pr = await fetchVariantPrice(API_BASE, p.variants[0].id);
        if (pr) {
          priceStr =
            pr.currency_code === "USD"
              ? `$${pr.amount.toFixed(2)}`
              : `${pr.currency_code.toUpperCase()} ${pr.amount.toFixed(2)}`;
        }
      }
      products.push({
        name: p.title,
        price: priceStr,
        href: `/products/${p.handle}`,
        bg: pickBg(i),
        image: p.thumbnail || null,
      });
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products";
  }

  return { products, error };
}
