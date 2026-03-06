import type { Product, ProductsListResponse, ListProductsParams, PaginationMeta } from './types.js';

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
	const raw = (await res.json()) as
		| { rows: Product[]; pagination: PaginationMeta }
		| { products?: Product[]; count?: number; offset?: number; limit?: number };
	const pagination: PaginationMeta =
		'pagination' in raw && raw.pagination
			? raw.pagination
			: (() => {
					const legacy = raw as {
						products?: Product[];
						count?: number;
						offset?: number;
						limit?: number;
					};
					const limitNum = legacy.limit ?? 10;
					const total = legacy.count ?? 0;
					const offsetVal = legacy.offset ?? 0;
					const pageNum = limitNum > 0 ? Math.floor(offsetVal / limitNum) + 1 : 1;
					const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 1;
					return {
						total,
						page: pageNum,
						limit: limitNum,
						total_pages: totalPages,
						has_next_page: pageNum < totalPages,
						has_previous_page: pageNum > 1
					};
				})();
	let rows: Product[] =
		'rows' in raw && Array.isArray(raw.rows)
			? raw.rows
			: ((raw as { products?: Product[] }).products ?? []);
	rows = rows.map((p: Product) => {
		const cat = p.category as
			| { id: string; value: string; handle: string }
			| { id: string; name?: string; value?: string; handle?: string }
			| null
			| undefined;
		if (cat && 'name' in cat && !('value' in cat && cat.value !== undefined)) {
			return {
				...p,
				category: {
					id: cat.id,
					value: cat.name ?? cat.value ?? '',
					handle: (cat as { handle?: string }).handle ?? ''
				}
			};
		}
		return p;
	});
	return {
		data: { rows, pagination },
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
