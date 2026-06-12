import {
	priceAmountDecimal,
	resolveVariantPrice,
	type VariantPrice,
} from '$lib/pricing';
import { getSelectedCurrencyCode } from '$lib/region/region-state.svelte';
import type { StorefrontProductListRow } from './product';

export type ProductGridItem = {
	name: string;
	price: { amount: number; currency_code: string };
	prices?: VariantPrice[];
	href: string;
	bg: string;
	image: string | null;
	variantId?: string | null;
	variantTitle?: string | null;
	variant_id?: string | null;
	variants?: Array<{ id?: string | null; title?: string | null }>;
	variant?: { id?: string | null; title?: string | null } | null;
};

const FALLBACK_BGS = ['#e8e0d5', '#4a4a4a', '#f5f0eb', '#6b7c5c'];

export function pickBg(index: number): string {
	return FALLBACK_BGS[index % FALLBACK_BGS.length];
}

export function resolveGridItemPrice(
	item: Pick<ProductGridItem, 'price' | 'prices'>,
	currencyCode = getSelectedCurrencyCode(),
): { amount: number; currency_code: string } {
	const resolved = resolveVariantPrice(item.prices, currencyCode);
	if (resolved) {
		const amount = priceAmountDecimal(resolved);
		return {
			amount: Number.isFinite(amount) ? amount : Number.NaN,
			currency_code: resolved.currency_code,
		};
	}
	return item.price;
}

export function toProductGridItem(
	row: StorefrontProductListRow,
	index: number,
	options?: { preferProductThumbnail?: boolean; currencyCode?: string },
): ProductGridItem {
	const prices = (row.variant?.prices ?? []) as VariantPrice[];
	const currencyCode = options?.currencyCode ?? getSelectedCurrencyCode();
	const resolved = resolveVariantPrice(prices, currencyCode);
	const fallback = row.variant?.price;
	const amount = resolved
		? priceAmountDecimal(resolved)
		: fallback?.amount != null
			? parseInt(fallback.amount, 10) / 100
			: Number.NaN;
	const currency_code =
		resolved?.currency_code ?? fallback?.currency_code ?? currencyCode;
	const image = options?.preferProductThumbnail
		? (row.thumbnail ?? row.variant?.thumbnail ?? null)
		: (row.variant?.thumbnail ?? row.thumbnail ?? null);
	return {
		name: row.title,
		prices,
		price: {
			amount: Number.isFinite(amount) ? amount : Number.NaN,
			currency_code,
		},
		href: `/products/${row.handle}`,
		bg: pickBg(index),
		image,
		variantId: row.variant?.id ?? null,
		variantTitle: row.variant?.title ?? null,
	};
}
