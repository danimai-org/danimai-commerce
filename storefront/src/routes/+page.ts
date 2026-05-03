import { API_BASE, rowsFromPaginated } from "../lib/api/storefront-api";
import { client } from "$lib/api/client.js";
import type { PageLoad } from "./$types";

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
    const res = await client.admin.collections.get({
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
    const pag = (data as { pagination?: { has_next_page?: boolean } })
      .pagination;
    if (!pag?.has_next_page) break;
    page += 1;
    if (page > 500) break;
  }
  return out;
}

const FALLBACK_BGS = ["#e8e0d5", "#4a4a4a", "#f5f0eb", "#6b7c5c"];

function pickBg(index: number): string {
  return FALLBACK_BGS[index % FALLBACK_BGS.length];
}

type StorefrontProductRow = {
  title: string;
  handle: string;
  variant: {
    id: string;
    title: string;
    thumbnail: string | null;
    price: { amount: string; currency_code: string } | null;
  } | null;
};

export type HomeProductGridItem = {
  name: string;
  price: { amount: number; currency_code: string };
  href: string;
  bg: string;
  image: string | null;
  variantId: string | null;
  variantTitle: string | null;
};

export const load: PageLoad = async ({ fetch }) => {
  const products: HomeProductGridItem[] = [];
  const collections = await loadAllCollections();
  let error: string | null = null;

  try {
    const root = API_BASE.replace(/\/admin\/?$/, "");
    const sfRes = await fetch(
      `${root}/storefront/products?${new URLSearchParams({ limit: "8", page: "1" })}`,
      { cache: "no-store" },
    );
    if (!sfRes.ok) throw new Error("Failed to load products");
    const sfData = (await sfRes.json()) as unknown;
    const { rows: list } = rowsFromPaginated<StorefrontProductRow>(sfData);
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const pr = p.variant?.price;
      const amount = pr?.amount != null ? parseInt(pr.amount, 10) / 100 : 0;
      const currency_code = pr?.currency_code ?? "EUR";
      products.push({
        name: p.title,
        price: { amount, currency_code },
        href: `/products/${p.handle}`,
        bg: pickBg(i),
        image: p.variant?.thumbnail ?? null,
        variantId: p.variant?.id ?? null,
        variantTitle: p.variant?.title ?? null,
      });
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products";
  }

  return { products, collections, error };
};
