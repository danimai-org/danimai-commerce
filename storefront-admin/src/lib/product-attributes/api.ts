import type {
	ProductAttribute,
	AttributesResponse,
	ListAttributesParams,
	PaginationMeta
} from './types.js';

const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export async function listAttributes(
	params: ListAttributesParams
): Promise<AttributesResponse> {
	const searchParams = new URLSearchParams();
	if (params.page != null) searchParams.set('page', String(params.page));
	if (params.limit != null) searchParams.set('limit', String(params.limit));
	if (params.sorting_field) searchParams.set('sorting_field', params.sorting_field);
	if (params.sorting_direction) searchParams.set('sorting_direction', params.sorting_direction);

	const res = await fetch(`${getApiBase()}/product-attributes?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	const raw = (await res.json()) as { rows?: ProductAttribute[]; pagination?: PaginationMeta };
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

export async function deleteAttributes(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/product-attributes`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ attribute_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function createAttribute(body: {
	title: string;
	type: string;
	metadata?: Record<string, string | number>;
}): Promise<ProductAttribute> {
	const res = await fetch(`${getApiBase()}/product-attributes`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<ProductAttribute>;
}

export async function updateAttribute(
	id: string,
	body: { title?: string; type?: string }
): Promise<ProductAttribute> {
	const res = await fetch(`${getApiBase()}/product-attributes/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<ProductAttribute>;
}
