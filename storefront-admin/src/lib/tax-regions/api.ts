import type { TaxRegionsListResponse, TaxRegionFormPayload } from './types.js';

const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

type ListParams = {
	page?: number | string;
	limit?: number | string;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
	[key: string]: unknown;
};

export async function listTaxRegions(
	params: ListParams
): Promise<TaxRegionsListResponse> {
	const searchParams = new URLSearchParams();
	if (params.page != null) searchParams.set('page', String(params.page));
	if (params.limit != null) searchParams.set('limit', String(params.limit));
	if (params.sorting_field != null) searchParams.set('sorting_field', String(params.sorting_field));
	if (params.sorting_direction != null)
		searchParams.set('sorting_direction', String(params.sorting_direction));
	Object.entries(params).forEach(([k, v]) => {
		if (['page', 'limit', 'sorting_field', 'sorting_direction'].includes(k)) return;
		if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v));
	});
	const res = await fetch(`${getApiBase()}/tax-regions?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<TaxRegionsListResponse>;
}

export async function createTaxRegion(
	payload: TaxRegionFormPayload
): Promise<void> {
	const res = await fetch(`${getApiBase()}/tax-regions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			tax_regions: [
				{
					name: payload.name.trim(),
					tax_provider_id: payload.tax_provider_id || null
				}
			]
		})
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function updateTaxRegion(
	id: string,
	payload: TaxRegionFormPayload
): Promise<void> {
	const res = await fetch(`${getApiBase()}/tax-regions/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			name: payload.name.trim(),
			tax_provider_id: payload.tax_provider_id || null
		})
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function deleteTaxRegions(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/tax-regions`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tax_region_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}
