const API_BASE =
	(import.meta.env?.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000';

export type ProductGridItem = {
	name: string;
	price: string;
	href: string;
	bg: string;
	image?: string | null;
};

type ApiCategory = {
	id: string;
	value: string;
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

const SORT_OPTIONS: Record<string, { sorting_field: string; sorting_direction: string }> = {
	'best-selling': { sorting_field: 'created_at', sorting_direction: 'desc' },
	newest: { sorting_field: 'created_at', sorting_direction: 'desc' },
	'title-asc': { sorting_field: 'title', sorting_direction: 'asc' },
	'title-desc': { sorting_field: 'title', sorting_direction: 'desc' }
};

/** Handles that show all "tops" products (t-shirts, jackets, shirts, sweatshirts, etc.) */
const TOPS_SUBCATEGORY_HANDLES = [
	'tops',
	't-shirts',
	'shirts',
	'jackets',
	'jackets-coats',
	'sweatshirts',
	'long-sleeves',
	'hoodies'
];

/** Handles that show all "bottoms" products (leggings, shorts, joggers, pants, etc.) */
const BOTTOMS_SUBCATEGORY_HANDLES = [
	'bottoms',
	'leggings',
	'shorts',
	'joggers',
	'pants',
	'pants-trousers',
	'skirts'
];

export async function load({
	params,
	url
}: {
	params: { handle: string };
	url: URL;
}) {
	const handle = params.handle ? decodeURIComponent(params.handle).trim() : '';
	if (!handle) {
		return { category: null, products: [], productCount: 0, error: 'Missing category', sort: 'best-selling', availability: 'all', price: 'all', color: 'all' };
	}

	const sortParam = url.searchParams.get('sort') ?? 'best-selling';
	const sort = SORT_OPTIONS[sortParam] ? sortParam : 'best-selling';
	const availability = url.searchParams.get('availability') ?? 'all';
	const price = url.searchParams.get('price') ?? 'all';
	const color = url.searchParams.get('color') ?? 'all';

	let category: ApiCategory | null = null;
	const products: ProductGridItem[] = [];
	let productCount = 0;

	try {
		const catRes = await fetch(`${API_BASE}/product-categories?limit=100&page=1`, { cache: 'no-store' });
		if (!catRes.ok) return { category: null, products: [], productCount: 0, error: 'Failed to load categories', sort: sortParam, availability, price, color };
		const catData = (await catRes.json()) as { data?: ApiCategory[] };
		const categories = catData.data ?? [];

		const aggregateConfig =
			handle === 'tops'
				? { handles: TOPS_SUBCATEGORY_HANDLES, mainHandle: 'tops' as const }
				: handle === 'bottoms'
					? { handles: BOTTOMS_SUBCATEGORY_HANDLES, mainHandle: 'bottoms' as const }
					: null;
		let categoryIds: string[];

		if (aggregateConfig) {
			const subCategories = categories.filter((c) =>
				aggregateConfig.handles.includes(c.handle)
			);
			if (subCategories.length === 0) {
				category = categories.find((c) => c.handle === aggregateConfig.mainHandle) ?? null;
				if (!category) {
					return { category: null, products: [], productCount: 0, error: 'Category not found', sort: sortParam, availability, price, color };
				}
				categoryIds = [category.id];
			} else {
				categoryIds = subCategories.map((c) => c.id);
				category = subCategories.find((c) => c.handle === aggregateConfig.mainHandle) ?? subCategories[0] ?? null;
			}
		} else {
			category = categories.find((c) => c.handle === handle) ?? null;
			if (!category) {
				return { category: null, products: [], productCount: 0, error: 'Category not found', sort: sortParam, availability, price, color };
			}
			categoryIds = [category.id];
		}

		const { sorting_field, sorting_direction } = SORT_OPTIONS[sort];
		const productsQuery = new URLSearchParams({
			limit: '50',
			page: '1',
			sorting_field,
			sorting_direction
		});
		if (categoryIds.length === 1) {
			productsQuery.set('category_id', categoryIds[0]);
		} else {
			productsQuery.set('category_ids', categoryIds.join(','));
		}
		const productsRes = await fetch(
			`${API_BASE}/products?${productsQuery.toString()}`,
			{ cache: 'no-store' }
		);
		if (!productsRes.ok) return { category: { ...category }, products: [], productCount: 0, error: null, sort: sortParam, availability, price, color };
		const productsData = (await productsRes.json()) as { products?: ApiProduct[]; count?: number };
		const list = productsData.products ?? [];
		productCount = productsData.count ?? list.length;

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
							: `${pr.currency_code.toUpperCase()} ${pr.amount.toFixed(2)}`;
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
			category: null,
			products: [],
			productCount: 0,
			error: e instanceof Error ? e.message : 'Failed to load category',
			sort: sortParam,
			availability,
			price,
			color
		};
	}

	return {
		category: category ? { id: category.id, value: category.value, handle: category.handle } : null,
		products,
		productCount,
		error: null,
		sort: sortParam,
		availability,
		price,
		color
	};
}
