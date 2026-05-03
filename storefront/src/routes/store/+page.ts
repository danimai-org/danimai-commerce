import { API_BASE, rowsFromPaginated } from "$lib/api/storefront-api";
import type { PageLoad } from "./$types";

const FALLBACK_BGS = ["#e8e0d5", "#4a4a4a", "#f5f0eb", "#6b7c5c"];

function pickBg(index: number): string {
  return FALLBACK_BGS[index % FALLBACK_BGS.length];
}

type StorefrontProductRow = {
  title: string;
  handle: string;
  thumbnail: string | null;
  variant: {
    id: string;
    title: string;
    thumbnail: string | null;
    price: { amount: string; currency_code: string } | null;
  } | null;
};

export type StoreProductGridItem = {
  name: string;
  price: { amount: number; currency_code: string };
  href: string;
  bg: string;
  image: string | null;
  variantId: string | null;
  variantTitle: string | null;
};

export const load: PageLoad = async ({ fetch }) => {
  const products: StoreProductGridItem[] = [];
  let error: string | null = null;

  try {
    const root = API_BASE.replace(/\/admin\/?$/, "");
    let pageNum = 1;
    const limit = 100;
    for (;;) {
      const sp = new URLSearchParams({
        limit: String(limit),
        page: String(pageNum),
        sorting_field: "products.title",
        sorting_direction: "asc",
      });
      const sfRes = await fetch(`${root}/storefront/products?${sp}`, {
        cache: "no-store",
      });
      if (!sfRes.ok) throw new Error("Failed to load products");
      const sfData = (await sfRes.json()) as unknown;
      const { rows: list } = rowsFromPaginated<StorefrontProductRow>(sfData);
      const offset = products.length;
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const pr = p.variant?.price;
        const amount = pr?.amount != null ? parseInt(pr.amount, 10) / 100 : 0;
        const currency_code = pr?.currency_code ?? "EUR";
        products.push({
          name: p.title,
          price: { amount, currency_code },
          href: `/products/${p.handle}`,
          bg: pickBg(offset + i),
          image: p.thumbnail ?? p.variant?.thumbnail ?? null,
          variantId: p.variant?.id ?? null,
          variantTitle: p.variant?.title ?? null,
        });
      }
      const pag = (sfData as { pagination?: { has_next_page?: boolean } })
        .pagination;
      if (!pag?.has_next_page || list.length === 0) break;
      pageNum += 1;
      if (pageNum > 500) break;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products";
  }

  return { products, error };
};
