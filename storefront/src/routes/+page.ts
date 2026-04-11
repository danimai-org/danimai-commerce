import type { ProductGridItem } from "./store/+page.ts";
import { API_BASE, rowsFromPaginated } from "../lib/api/storefront-api";

export type HomeCollectionCard = {
  title: string;
  handle: string;
  image: string;
};

type ApiCollectionRow = {
  title: string;
  handle: string;
  metadata?: unknown | null;
};

const DEFAULT_COLLECTION_IMAGES = [
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  "https://images.unsplash.com/photo-1617137968427-85924c2a0505?w=800&q=80",
];

function imageFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  for (const key of ["image", "cover_image", "thumbnail", "hero_image"] as const) {
    const v = m[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

async function loadAllCollections(): Promise<HomeCollectionCard[]> {
  const out: HomeCollectionCard[] = [];
  let page = 1;
  const limit = 100;
  let totalPages = 1;
  do {
    const params = new URLSearchParams({ limit: String(limit), page: String(page) });
    const res = await fetch(`${API_BASE}/collections?${params}`, { cache: "no-store" });
    if (!res.ok) return out;
    const data = await res.json();
    const { rows } = rowsFromPaginated<ApiCollectionRow>(data);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const handle = (row.handle ?? "").trim();
      if (!handle) continue;
      out.push({
        title: row.title,
        handle,
        image:
          imageFromMetadata(row.metadata) ??
          DEFAULT_COLLECTION_IMAGES[out.length % DEFAULT_COLLECTION_IMAGES.length],
      });
    }
    const pag = (data as { pagination?: { total_pages?: number } }).pagination;
    totalPages = pag?.total_pages ?? 1;
    page++;
  } while (page <= totalPages);
  return out;
}

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
  const collections = await loadAllCollections();
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

  return { products, collections, error };
}
