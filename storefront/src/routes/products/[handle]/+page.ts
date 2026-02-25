const API_BASE =
	(import.meta.env?.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000';

type ApiProductList = {
	id: string;
	title: string;
	handle: string;
	thumbnail: string | null;
	variants: Array<{ id: string }>;
};

type ApiProduct = ApiProductList & {
	subtitle?: string | null;
	description?: string | null;
	status?: string;
	category_id?: string | null;
};

type ApiVariant = {
	id: string;
	title: string;
	product_id: string | null;
	thumbnail: string | null;
	prices?: Array<{ amount: string; currency_code: string }>;
};

async function fetchProductByHandle(handle: string): Promise<ApiProductList | null> {
	const decoded = decodeURIComponent(handle).trim();
	// Use search to narrow results, then exact match by handle
	const searchParams = new URLSearchParams({ limit: '50', page: '1' });
	if (decoded) searchParams.set('search', decoded);
	const res = await fetch(`${API_BASE}/products?${searchParams}`, { cache: 'no-store' });
	if (!res.ok) return null;
	const data = (await res.json()) as { products?: ApiProductList[] };
	const list = data.products ?? [];
	const found = list.find((p) => p.handle === decoded || p.handle === handle);
	if (found) return found;
	// Fallback: fetch first page with higher limit and find by handle
	const fallbackParams = new URLSearchParams({ limit: '200', page: '1' });
	const res2 = await fetch(`${API_BASE}/products?${fallbackParams}`, { cache: 'no-store' });
	if (!res2.ok) return null;
	const data2 = (await res2.json()) as { products?: ApiProductList[] };
	const list2 = data2.products ?? [];
	return list2.find((p) => p.handle === decoded || p.handle === handle) ?? null;
}

export async function load({ params }) {
	const rawHandle = params.handle as string;
	const handle = rawHandle ? decodeURIComponent(rawHandle).trim() : '';
	if (!handle) {
		return { product: null, variants: [], otherProducts: [], error: 'Invalid product' };
	}

	try {
		const listProduct = await fetchProductByHandle(handle);
		if (!listProduct) {
			return { product: null, variants: [], otherProducts: [], error: 'Product not found' };
		}

		const [productRes, variantsRes] = await Promise.all([
			fetch(`${API_BASE}/products/${listProduct.id}`, { cache: 'no-store' }),
			fetch(`${API_BASE}/product-variants?limit=100`, { cache: 'no-store' })
		]);

		if (!productRes.ok) {
			return { product: null, variants: [], otherProducts: [], error: 'Product not found' };
		}

		const product = (await productRes.json()) as ApiProduct;
		const variantsPayload = (await variantsRes.json()) as { data?: ApiVariant[] };
		const allVariants = variantsPayload.data ?? [];
		const variants = allVariants.filter((v) => v.product_id === listProduct.id);

		// Fetch price for each variant
		const variantsWithPrices: Array<ApiVariant & { priceDisplay: string }> = await Promise.all(
			variants.map(async (v) => {
				try {
					const r = await fetch(`${API_BASE}/product-variants/${v.id}`, { cache: 'no-store' });
					if (!r.ok) return { ...v, priceDisplay: '—' };
					const data = (await r.json()) as ApiVariant;
					const prices = data.prices ?? [];
					if (prices.length === 0) return { ...v, priceDisplay: '—' };
					const p = prices[0];
					const amount = parseInt(p.amount, 10) / 100;
					const priceDisplay =
						p.currency_code === 'USD' ? `$${amount.toFixed(2)}` : `${p.currency_code.toUpperCase()} ${amount.toFixed(2)}`;
					return { ...v, prices: data.prices, priceDisplay };
				} catch {
					return { ...v, priceDisplay: '—' };
				}
			})
		);

		const minPrice = variantsWithPrices
			.map((v) => v.priceDisplay)
			.filter((p) => p !== '—')[0];
		const priceLabel = minPrice ? `From ${minPrice}` : '—';

		// Load other products for "You May Also Like" (exclude current, take 4)
		const listRes2 = await fetch(`${API_BASE}/products?limit=20&page=1`, { cache: 'no-store' });
		const listData2 = (await listRes2.json()) as { products?: ApiProductList[] };
		const others = (listData2.products ?? []).filter((p) => p.id !== listProduct.id).slice(0, 4);
		const otherProducts = await Promise.all(
			others.map(async (p, i) => {
				const vId = p.variants?.[0]?.id;
				let priceStr = '—';
				if (vId) {
					try {
						const r = await fetch(`${API_BASE}/product-variants/${vId}`, { cache: 'no-store' });
						if (r.ok) {
							const d = (await r.json()) as ApiVariant;
							const pr = d.prices?.[0];
							if (pr) {
								const amt = parseInt(pr.amount, 10) / 100;
								priceStr = pr.currency_code === 'USD' ? `$${amt.toFixed(2)}` : `${pr.currency_code.toUpperCase()} ${amt.toFixed(2)}`;
							}
						}
					} catch {}
				}
				const bgs = ['#e8e0d5', '#4a4a4a', '#f5f0eb', '#6b7c5c'];
				return { name: p.title, price: priceStr, href: `/products/${p.handle}`, bg: bgs[i % 4], image: p.thumbnail || null };
			})
		);

		return {
			product: { ...product, priceLabel },
			variants: variantsWithPrices,
			otherProducts,
			error: null
		};
	} catch (e) {
		return {
			product: null,
			variants: [],
			otherProducts: [],
			error: e instanceof Error ? e.message : 'Failed to load product'
		};
	}
}
