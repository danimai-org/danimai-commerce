import { client } from "$lib/api/client.js";
import type { CartLineVariantRef } from "$lib/types/cart";
import type {
	AdminProductVariantDetail,
	AdminProductVariantRow,
} from "$lib/types/admin";
import {
	normalizeCurrencyCode,
	priceAmountDecimal,
	resolveVariantPrice,
	type VariantPrice,
} from "$lib/pricing";

export type VariantDisplayRow = {
	title: string;
	sku: string | null;
	thumbnail: string | null;
	unitPrice: number | null;
};

export type { CartLineVariantRef };

type VariantPriceSource = {
	prices?: VariantPrice[];
	price_sets?: Array<{ prices?: VariantPrice[] }>;
};

function extractVariantPrices(source: VariantPriceSource): VariantPrice[] {
	if (source.prices?.length) return source.prices;
	return (source.price_sets ?? []).flatMap((priceSet) =>
		(priceSet.prices ?? []).map((price) => ({
			amount: price.amount,
			currency_code: price.currency_code,
		})),
	);
}

function unitPriceFromPrices(
	prices: VariantPrice[] | undefined,
	currencyCode: string,
): number | null {
	const resolved = resolveVariantPrice(prices, currencyCode);
	const amount = priceAmountDecimal(resolved);
	return Number.isFinite(amount) ? amount : null;
}

/**
 * Loads variant title/thumbnail/SKU for cart line items. Prefers list fetch by
 * product_id (same source as the product page) so titles match storefront data.
 */
export async function fetchVariantDisplayMap(
	lineItems: CartLineVariantRef[],
	currencyCode?: string,
): Promise<Map<string, VariantDisplayRow>> {
	const next = new Map<string, VariantDisplayRow>();
	const byProduct = new Map<string, Set<string>>();
	const noProduct: string[] = [];
	const targetCurrency = normalizeCurrencyCode(currencyCode ?? "");

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
			const rows = (res.data.rows ?? []) as AdminProductVariantRow[];
			for (const row of rows) {
				if (!variantIds.has(row.id)) continue;
				const prices = extractVariantPrices(row as VariantPriceSource);
				next.set(row.id, {
					title: row.title,
					sku: row.sku ?? null,
					thumbnail: row.thumbnail ?? null,
					unitPrice: targetCurrency
						? unitPriceFromPrices(prices, targetCurrency)
						: unitPriceFromPrices(prices, prices[0]?.currency_code ?? ""),
				});
			}
		}),
	);

	await Promise.all(
		noProduct.map(async (id) => {
			if (next.has(id)) return;
			const res = await client.admin["product-variants"]({ id }).get();
			if (res.error || !res.data) return;
			const d = res.data as AdminProductVariantDetail;
			const prices = extractVariantPrices(d as VariantPriceSource);
			next.set(id, {
				title: d.title,
				sku: d.sku ?? null,
				thumbnail: d.thumbnail ?? null,
				unitPrice: targetCurrency
					? unitPriceFromPrices(prices, targetCurrency)
					: unitPriceFromPrices(prices, prices[0]?.currency_code ?? ""),
			});
		}),
	);

	return next;
}

export async function fetchVariantUnitPriceMap(
	variantIds: string[],
	currencyCode: string,
): Promise<Map<string, number | null>> {
	const uniqueIds = [...new Set(variantIds.filter(Boolean))];
	const next = new Map<string, number | null>();
	if (uniqueIds.length === 0) return next;

	await Promise.all(
		uniqueIds.map(async (id) => {
			const res = await client.admin["product-variants"]({ id }).get();
			if (res.error || !res.data) {
				next.set(id, null);
				return;
			}
			const d = res.data as AdminProductVariantDetail;
			const prices = extractVariantPrices(d as VariantPriceSource);
			next.set(id, unitPriceFromPrices(prices, currencyCode));
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
