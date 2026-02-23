const API_BASE =
	(import.meta.env?.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000';

export type ProductGridItem = {
	name: string;
	price: string;
	href: string;
	bg: string;
	image?: string | null;
};

type ApiCollection = {
	id: string;
	title: string;
	handle: string;
};

type ApiProduct = {
	id: string;
	title: string;
	handle: string;
	thumbnail: string | null;
	variants: Array<{ id: string }>;
};

type ApiVariant = {
	id: string;
	prices?: Array<{ amount: string; currency_code: string }>;
};

const FALLBACK_BGS = ['#e8e0d5', '#4a4a4a', '#f5f0eb', '#6b7c5c'];

function pickBg(index: number): string {
	return FALLBACK_BGS[index % FALLBACK_BGS.length];
}

async function fetchVariantPrice(
	apiBase: string,
	variantId: string
): Promise<{ amount: number; currency_code: string } | null> {
	try {
		const res = await fetch(`${apiBase}/product-variants/${variantId}`, { cache: 'no-store' });
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

export async function load({ params }: { params: { handle: string } }) {
	const handle = params.handle ? decodeURIComponent(params.handle).trim() : '';
	if (!handle) {
		return { collection: null, products: [], error: 'Missing collection' };
	}

	let collection: ApiCollection | null = null;
	const products: ProductGridItem[] = [];

	try {
		const listRes = await fetch(`${API_BASE}/collections?limit=100&page=1`, { cache: 'no-store' });
		if (!listRes.ok) return { collection: null, products: [], error: 'Failed to load collections' };
		const listData = (await listRes.json()) as { data?: ApiCollection[] };
		const collections = listData.data ?? [];
		collection = collections.find((c) => c.handle === handle) ?? null;

		if (!collection) {
			return { collection: null, products: [], error: 'Collection not found' };
		}

		const productsRes = await fetch(
			`${API_BASE}/collections/${collection.id}/products?limit=50&page=1`,
			{ cache: 'no-store' }
		);
		if (!productsRes.ok) return { collection: { ...collection }, products: [], error: null };
		const productsData = (await productsRes.json()) as { products?: ApiProduct[] };
		const list = productsData.products ?? [];

		const variantIds = list
			.map((p) => p.variants?.[0]?.id)
			.filter((id): id is string => !!id);
		const pricePromises = variantIds.map((id) => fetchVariantPrice(API_BASE, id));
		const prices = await Promise.all(pricePromises);

		let priceIndex = 0;
		for (let i = 0; i < list.length; i++) {
			const p = list[i];
			const firstVariantId = p.variants?.[0]?.id;
			let priceStr = '—';
			if (firstVariantId && priceIndex < prices.length) {
				const pr = prices[priceIndex];
				priceIndex++;
				if (pr) {
					priceStr =
						pr.currency_code === 'USD'
							? `$${pr.amount.toFixed(2)}`
							: `${pr.currency_code} ${pr.amount.toFixed(2)}`;
				}
			}
			products.push({
				name: p.title,
				price: priceStr,
				href: `/products/${p.handle}`,
				bg: pickBg(i),
				image: p.thumbnail ?? null
			});
		}
	} catch (e) {
		return {
			collection: null,
			products: [],
			error: e instanceof Error ? e.message : 'Failed to load collection'
		};
	}

	return {
		collection: collection ? { id: collection.id, title: collection.title, handle: collection.handle } : null,
		products,
		error: null
	};
}
