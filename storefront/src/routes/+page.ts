import type { ProductGridItem } from "./store/+page.ts";
import { rowsFromPaginated } from "../lib/api/storefront-api";
import { client } from "$lib/api/client.js";

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
  for (const key of [
    "image",
    "cover_image",
    "thumbnail",
    "hero_image",
  ] as const) {
    const v = m[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

async function loadAllCollections(): Promise<HomeCollectionCard[]> {
  const out: HomeCollectionCard[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await client.collections.get({
      query: { limit: String(limit), page: String(page) },
    });
    if (res.error) return out;
    const data = res.data as unknown;
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
          DEFAULT_COLLECTION_IMAGES[
            out.length % DEFAULT_COLLECTION_IMAGES.length
          ],
      });
    }
    const pag = (data as { pagination?: { has_next_page?: boolean } }).pagination;
    if (!pag?.has_next_page) break;
    page += 1;
    if (page > 500) break;
  }
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
  variantId: string,
): Promise<{ amount: number; currency_code: string } | null> {
  try {
    const res = await client["product-variants"]({ id: variantId }).get();
    if (res.error) return null;
    const data = res.data as ApiVariant;
    const prices = data.prices ?? [];
    if (prices.length === 0) return null;
    const p = prices[0];
    const amount = parseInt(p.amount, 10) / 100;
    return { amount: amount ?? 0, currency_code: p.currency_code ?? "USD" };
  } catch {
    return null;
  }
}

export async function load() {
  const products: ProductGridItem[] = [];
  const collections = await loadAllCollections();
  let error: string | null = null;

  try {
    const res = await client.products.get({
      query: { limit: "8", page: "1" },
    });
    if (res.error) throw new Error("Failed to load products");
    const data = res.data as unknown;
    const { rows: list } = rowsFromPaginated<{
      title: string;
      handle: string;
      thumbnail?: string | null;
      variants?: Array<{ id: string }>;
    }>(data);
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      let price = 0;
      if (p.variants?.[0]?.id) {
        const pr = await fetchVariantPrice(p.variants[0].id);
        if (pr) {
          price =
            pr.currency_code === "USD"
              ? parseFloat(String(pr.amount).replace(/[^0-9.]/g, ""))
              : pr.amount;
        }
      }
      products.push({
        name: p.title,
        price: {
          amount: price ?? 0,
          currency_code: "USD",
        },
        href: `/products/${p.handle}`,
        bg: pickBg(i),
        image: p.thumbnail ?? null,
      });
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products";
  }

  return { products, collections, error };
}
