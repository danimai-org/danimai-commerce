import type { Product, ProductsListResponse, ListProductsParams } from './types.js';

const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export async function listProducts(params: ListProductsParams): Promise<ProductsListResponse> {
	const searchParams = new URLSearchParams();
	if (params.page != null) searchParams.set('page', String(params.page));
	if (params.limit != null) searchParams.set('limit', String(params.limit));
	if (params.sorting_field) searchParams.set('sorting_field', params.sorting_field);
	if (params.sorting_direction) searchParams.set('sorting_direction', params.sorting_direction);
	if (params.search?.trim()) searchParams.set('search', params.search.trim());
	if (params.category_ids?.length) searchParams.set('category_ids', params.category_ids.join(','));

	const res = await fetch(`${getApiBase()}/products?${searchParams}`, { cache: 'no-store' });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	const raw = (await res.json()) as {
		products?: Product[];
		count?: number;
		offset?: number;
		limit?: number;
	};
	const limitNum = raw.limit ?? 10;
	const total = raw.count ?? 0;
	const offsetVal = raw.offset ?? 0;
	const pageNum = limitNum > 0 ? Math.floor(offsetVal / limitNum) + 1 : 1;
	const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 1;
	const pagination = {
		total,
		page: pageNum,
		limit: limitNum,
		total_pages: totalPages,
		has_next_page: pageNum < totalPages,
		has_previous_page: pageNum > 1
	};
	return {
		data: { rows: raw.products ?? [], pagination },
		pagination
	};
}

export async function deleteProducts(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/products`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ product_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}
