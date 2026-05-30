import type { StorefrontProductListRow } from './product';

export type ProductGridItem = {
	name: string;
	price: { amount: number; currency_code: string };
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

export function toProductGridItem(
	row: StorefrontProductListRow,
	index: number,
	options?: { preferProductThumbnail?: boolean },
): ProductGridItem {
	const pr = row.variant?.price;
	const amount = pr?.amount != null ? parseInt(pr.amount, 10) / 100 : Number.NaN;
	const currency_code = pr?.currency_code ?? 'EUR';
	const image = options?.preferProductThumbnail
		? (row.thumbnail ?? row.variant?.thumbnail ?? null)
		: (row.variant?.thumbnail ?? row.thumbnail ?? null);
	return {
		name: row.title,
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
