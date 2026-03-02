import type { ProductCollection, CollectionsListResponse, ListCollectionsParams } from './types.js';
import type { PaginationMeta } from '$lib/product-categories/types.js';

const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export async function listCollections(
	params: ListCollectionsParams
): Promise<CollectionsListResponse> {
	const searchParams = new URLSearchParams();
	if (params.page != null) searchParams.set('page', String(params.page));
	if (params.limit != null) searchParams.set('limit', String(params.limit));
	if (params.sorting_field) searchParams.set('sorting_field', params.sorting_field);
	if (params.sorting_direction) searchParams.set('sorting_direction', params.sorting_direction);
	if (params.search?.trim()) searchParams.set('search', params.search.trim());
	if (params.sales_channel_ids?.length)
		searchParams.set('sales_channel_ids', params.sales_channel_ids.join(','));
	if (params.collection_type?.length)
		searchParams.set('collection_type', params.collection_type.join(','));

	const res = await fetch(`${getApiBase()}/collections?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	const raw = (await res.json()) as { rows?: ProductCollection[]; pagination?: PaginationMeta };
	const rows = raw.rows ?? [];
	const pagination: PaginationMeta = raw.pagination ?? {
		total: rows.length,
		page: 1,
		limit: 10,
		total_pages: 1,
		has_next_page: false,
		has_previous_page: false
	};
	return {
		data: { rows, pagination },
		pagination
	};
}

export async function deleteCollections(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/collections`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ collection_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}
