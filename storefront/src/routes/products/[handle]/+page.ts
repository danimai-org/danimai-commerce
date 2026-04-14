import type { PageLoad } from "./$types";
import { API_BASE, rowsFromPaginated } from "$lib/api/storefront-api";
import { client } from "$lib/api/client.js";
import type { ProductGridItem } from "../../store/+page.ts";

export type ProductPageProduct = {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  subtitle: string | null;
  description: string | null;
  priceLabel: string | null;
};

export type ProductPageVariant = {
  id: string;
  title: string;
  thumbnail: string | null;
  priceDisplay: string;
};

const FALLBACK_BGS = ["#e8e0d5", "#4a4a4a", "#f5f0eb", "#6b7c5c"];

function pickBg(index: number): string {
  return FALLBACK_BGS[index % FALLBACK_BGS.length];
}

function formatPrice(amount: number, code: string): string {
  if (code === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
  return `${amount} ${code}`;
}

async function fetchVariantPrice(
  variantId: string,
): Promise<{ amount: number; currency_code: string } | null> {
  try {
    const res = await client.admin["product-variants"]({ id: variantId }).get();
    if (res.error) return null;
    const data = res.data as unknown;
    const prices =
      (data as { prices?: Array<{ amount: string; currency_code: string }> })
        .prices ?? [];
    if (prices.length === 0) return null;
    const p = prices[0];
    const amount = parseInt(p.amount, 10) / 100;
    return { amount, currency_code: p.currency_code };
  } catch {
    return null;
  }
}

type VariantListRow = {
  id: string;
  title: string;
  thumbnail: string | null;
  product_id: string | null;
};

async function fetchVariantsForProduct(
  productId: string,
  variantCount: number,
): Promise<VariantListRow[]> {
  const collected: VariantListRow[] = [];
  let page = 1;
  let inBlock = false;
  const limit = 100;

  while (page <= 500) {
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      sorting_field: "product_id",
      sorting_direction: "asc",
    });
    const res = await fetch(`${API_BASE}/product-variants?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) break;
    const raw = (await res.json()) as unknown;
    const { rows } = rowsFromPaginated<VariantListRow>(raw);

    for (const v of rows) {
      if (v.product_id === productId) {
        inBlock = true;
        collected.push(v);
        if (variantCount > 0 && collected.length >= variantCount) {
          return collected;
        }
      } else if (inBlock) {
        return collected;
      }
    }

    const pag = (raw as { pagination?: { has_next_page?: boolean } })
      .pagination;
    if (!pag?.has_next_page) break;
    page++;
  }

  return collected;
}

type StorefrontProductRow = {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  variant: {
    id: string;
    title: string;
    thumbnail: string | null;
    price: {
      amount: string;
      currency_code: string;
    } | null;
  } | null;
};

async function variantsFromStorefrontSearch(
  handle: string,
): Promise<ProductPageVariant[]> {
  const root = API_BASE.replace(/\/admin\/?$/, "");
  const url = `${root}/storefront/products?${new URLSearchParams({
    search: handle,
    limit: "10",
    page: "1",
  })}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const raw = (await res.json()) as unknown;
  const { rows } = rowsFromPaginated<StorefrontProductRow>(raw);
  const match = rows.find((r) => r.handle === handle);
  if (!match?.variant?.id) return [];
  const pr = match.variant.price;
  const amount = pr?.amount != null ? parseInt(pr.amount, 10) / 100 : 0;
  const code = pr?.currency_code ?? "USD";
  return [
    {
      id: match.variant.id,
      title: match.variant.title,
      thumbnail: match.variant.thumbnail,
      priceDisplay: formatPrice(amount, code),
    },
  ];
}

async function loadOtherProducts(
  excludeHandle: string,
): Promise<ProductGridItem[]> {
  const root = API_BASE.replace(/\/admin\/?$/, "");
  const res = await fetch(
    `${root}/storefront/products?${new URLSearchParams({ limit: "16", page: "1" })}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const raw = (await res.json()) as unknown;
  const { rows } = rowsFromPaginated<StorefrontProductRow>(raw);
  const out: ProductGridItem[] = [];
  let i = 0;
  for (const p of rows) {
    if (p.handle === excludeHandle) continue;
    const pr = p.variant?.price;
    const amount = pr?.amount != null ? parseInt(pr.amount, 10) / 100 : 0;
    const code = pr?.currency_code ?? "USD";
    out.push({
      name: p.title,
      price: { amount, currency_code: code },
      href: `/products/${p.handle}`,
      bg: pickBg(i),
      image: p.thumbnail ?? p.variant?.thumbnail ?? null,
    });
    i++;
    if (out.length >= 8) break;
  }
  return out;
}

export const load: PageLoad = async ({ params }) => {
  const handleRaw = params.handle
    ? decodeURIComponent(String(params.handle)).trim()
    : "";
  if (!handleRaw) {
    return {
      product: null,
      variants: [] as ProductPageVariant[],
      otherProducts: [] as ProductGridItem[],
      error: "Product not found",
    };
  }

  const handle = handleRaw;

  try {
    const listRes = await client.admin["products"].get({
      query: { search: handle, limit: "50", page: "1" },
    });
    if (listRes.error) {
      return {
        product: null,
        variants: [],
        otherProducts: [],
        error: "Product not found",
      };
    }
    const { rows: candidates } = rowsFromPaginated<{
      id: string;
      title: string;
      handle: string;
      variant_count: number;
    }>(listRes.data as unknown);

    const row =
      candidates.find((p) => p.handle.toLowerCase() === handle.toLowerCase()) ??
      null;
    if (!row) {
      return {
        product: null,
        variants: [],
        otherProducts: [],
        error: "Product not found",
      };
    }

    const detailRes = await client.admin["products"]({ id: row.id }).get();

    if (detailRes.error || !detailRes.data) {
      return {
        product: null,
        variants: [],
        otherProducts: [],
        error: "Product not found",
      };
    }

    const detail = detailRes.data as {
      title: string;
      handle: string;
      thumbnail?: string | null;
      description?: string | null;
      metadata?: Record<string, unknown> | null;
    };

    const variantRows = await fetchVariantsForProduct(
      row.id,
      row.variant_count,
    );
    const prices = await Promise.all(
      variantRows.map((v) => fetchVariantPrice(v.id)),
    );
    let variants: ProductPageVariant[] = variantRows.map((v, i) => {
      const pr = prices[i];
      return {
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnail ?? null,
        priceDisplay: pr ? formatPrice(pr.amount, pr.currency_code) : "—",
      };
    });

    if (variants.length === 0) {
      variants = await variantsFromStorefrontSearch(handle);
    }

    if (variants.length === 0) {
      return {
        product: null,
        variants: [],
        otherProducts: [],
        error: "Product not found",
      };
    }

    const firstPrice = prices[0] ?? (await fetchVariantPrice(variants[0].id));
    const product: ProductPageProduct = {
      id: row.id,
      title: detail.title,
      handle: detail.handle,
      thumbnail:
        detail.thumbnail ??
        variantRows[0]?.thumbnail ??
        variants[0]?.thumbnail ??
        null,
      subtitle:
        typeof detail.metadata?.subtitle === "string"
          ? detail.metadata.subtitle
          : null,
      description: detail.description ?? null,
      priceLabel: firstPrice
        ? formatPrice(firstPrice.amount, firstPrice.currency_code)
        : (variants[0]?.priceDisplay ?? "—"),
    };

    const otherProducts = await loadOtherProducts(handle);

    return { product, variants, otherProducts, error: null as string | null };
  } catch (e) {
    return {
      product: null,
      variants: [],
      otherProducts: [],
      error: e instanceof Error ? e.message : "Failed to load product",
    };
  }
};
