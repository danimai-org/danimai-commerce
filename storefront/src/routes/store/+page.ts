import {
  API_BASE,
  firstVariantIdByProductIds,
  rowsFromPaginated,
} from "$lib/api/storefront-api";

export type ProductGridItem = {
  name: string;
  price: number | null;
  href: string;
  bg: string;
  image?: string | null;
  currency_code?: string | null;
};

type ApiProduct = {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string | null;
  variants?: Array<{ id: string }> | undefined;
  price?: number | string | null;
  currency_code?: string | null;
};

type ApiVariant = {
  id: string;
  prices?: Array<{ amount: string; currency_code: string }> | undefined;
};

const FALLBACK_BGS = ["#e8e0d5", "#4a4a4a", "#f5f0eb", "#6b7c5c"];

function pickBg(index: number): string {
  return FALLBACK_BGS[index % FALLBACK_BGS.length];
}

function normalizePrice(
  value: number | string | null | undefined,
): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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
    const params = new URLSearchParams({ limit: "100", page: "1" });
    const res = await fetch(`${API_BASE}/products?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      error = `Products failed: ${res.status}`;
      return { products, error };
    }
    const data = await res.json();
    const { rows: list } = rowsFromPaginated<ApiProduct>(data);
    const variantMap = await firstVariantIdByProductIds(
      API_BASE,
      list.map((p) => p.id),
    );

    const variantIds = list
      .map((p) => p.variants?.[0]?.id ?? variantMap.get(p.id))
      .filter((id): id is string => !!id);
    const pricePromises = variantIds.map((id) =>
      fetchVariantPrice(API_BASE, id),
    );
    const prices = await Promise.all(
      pricePromises.filter(
        (p): p is Promise<{ amount: number; currency_code: string } | null> =>
          !!p,
      ),
    );

    let priceIndex = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const firstVariantId = p.variants?.[0]?.id ?? variantMap.get(p.id);
      let price = null;
      let currency_code: string | null = null;
      if (firstVariantId && priceIndex < prices.length) {
        const pr = prices[priceIndex];
        priceIndex++;
        if (pr) {
          price = pr.amount;
          currency_code = pr.currency_code;
        }
      }
      if (price == null) {
        price = normalizePrice(p.price);
      }
      if (currency_code == null) {
        currency_code = p.currency_code ?? null;
      }
      products.push({
        name: p.title,
        price: price,
        currency_code: currency_code,
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
