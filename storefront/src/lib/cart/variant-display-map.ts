import { client } from "$lib/api/client.js";

export type VariantDisplayRow = {
    title: string;
    sku: string | null;
    thumbnail: string | null;
    unitPrice: number | null;
};

export type CartLineVariantRef = {
    variant_id?: string | null;
    product_id?: string | null;
};

/**
 * Loads variant title/thumbnail/SKU for cart line items. Prefers list fetch by
 * product_id (same source as the product page) so titles match storefront data.
 */
export async function fetchVariantDisplayMap(
    lineItems: CartLineVariantRef[],
): Promise<Map<string, VariantDisplayRow>> {
    const next = new Map<string, VariantDisplayRow>();
    const byProduct = new Map<string, Set<string>>();
    const noProduct: string[] = [];

    for (const li of lineItems) {
        const vid = li.variant_id;
        if (!vid) continue;
        if (li.product_id) {
            if (!byProduct.has(li.product_id)) {
                byProduct.set(li.product_id, new Set());
            }
            byProduct.get(li.product_id)!.add(vid);
        } else if (!noProduct.includes(vid)) {
            noProduct.push(vid);
        }
    }

    await Promise.all(
        [...byProduct.entries()].map(async ([productId, variantIds]) => {
            const res = await client.admin["product-variants"].get({
                query: { page: 1, limit: 100, filters: { product_id: productId } },
            });
            if (res.error || !res.data) return;
            const rows =
                (
                    res.data as {
                        rows?: Array<{
                            id: string;
                            title: string;
                            sku?: string | null;
                            thumbnail?: string | null;
                        }>;
                    }
                ).rows ?? [];
            for (const row of rows) {
                if (!variantIds.has(row.id)) continue;
                next.set(row.id, {
                    title: row.title,
                    sku: row.sku ?? null,
                    thumbnail: row.thumbnail ?? null,
                    unitPrice: null,
                });
            }
        }),
    );

    await Promise.all(
        noProduct.map(async (id) => {
            if (next.has(id)) return;
            const res = await client.admin["product-variants"]({ id }).get();
            if (res.error || !res.data) return;
            const d = res.data as {
                title: string;
                sku?: string | null;
                thumbnail?: string | null;
                prices?: Array<{ amount: string }>;
            };
            const raw = d.prices?.[0]?.amount;
            let unitPrice: number | null = null;
            if (raw != null && raw !== "") {
                const cents = parseInt(raw, 10);
                unitPrice = Number.isFinite(cents) ? cents / 100 : null;
            }
            next.set(id, {
                title: d.title,
                sku: d.sku ?? null,
                thumbnail: d.thumbnail ?? null,
                unitPrice,
            });
        }),
    );

    return next;
}

export function variantDisplayLabel(row: VariantDisplayRow | undefined): string {
    if (!row) return "";
    const t = row.title?.trim();
    if (t) return t;
    const s = row.sku?.trim();
    if (s) return s;
    return "";
}
