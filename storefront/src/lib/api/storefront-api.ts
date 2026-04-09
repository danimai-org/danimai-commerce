const base =
  typeof import.meta.env.VITE_PUBLIC_API_URL === "string" &&
  import.meta.env.VITE_PUBLIC_API_URL
    ? import.meta.env.VITE_PUBLIC_API_URL
    : "http://localhost:8000";

const root = base.replace(/\/$/, "");

/** Admin API prefix (`/admin/products`, `/admin/product-variants`, …). Matches `getClient(base).admin` in `client.ts`. */
export const API_BASE = root.endsWith("/admin") ? root : `${root}/admin`;

export function rowsFromPaginated<T>(raw: unknown): { rows: T[] } {
  const o = raw as { rows?: T[]; data?: T[] };
  const rows = o.rows ?? o.data ?? [];
  return { rows };
}

function rankValue(rank: number | null | undefined): number {
  return rank == null ? Number.POSITIVE_INFINITY : rank;
}

/**
 * Resolves the preferred variant id per product (lowest variant_rank) by scanning
 * paginated `/product-variants` until each requested product id is covered or pages end.
 */
export async function firstVariantIdByProductIds(
  apiBase: string,
  productIds: string[],
): Promise<Map<string, string>> {
  const wanted = new Set(productIds.filter(Boolean));
  const map = new Map<string, string>();
  const bestRank = new Map<string, number>();

  if (wanted.size === 0) return map;

  let page = 1;
  const limit = 100;

  for (;;) {
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      sorting_field: "variant_rank",
      sorting_direction: "asc",
    });
    const res = await fetch(`${apiBase}/product-variants?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) break;

    const raw = await res.json();
    const { rows } = rowsFromPaginated<{
      id: string;
      product_id: string | null;
      variant_rank: number | null;
    }>(raw);

    for (const v of rows) {
      const pid = v.product_id;
      if (!pid || !wanted.has(pid)) continue;
      const r = rankValue(v.variant_rank);
      const prev = bestRank.get(pid);
      if (prev === undefined || r < prev) {
        bestRank.set(pid, r);
        map.set(pid, v.id);
      }
    }

    let done = true;
    for (const id of wanted) {
      if (!map.has(id)) {
        done = false;
        break;
      }
    }
    if (done) break;

    const pagination = (raw as { pagination?: { has_next_page?: boolean } })
      .pagination;
    if (!pagination?.has_next_page) break;
    page += 1;
    if (page > 500) break;
  }

  return map;
}
