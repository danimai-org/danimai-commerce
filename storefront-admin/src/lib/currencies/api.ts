import type {
	CurrenciesListResponse,
	CurrencyFormPayload,
	CreateCurrenciesPayload,
	AvailableCurrenciesResponse
} from './types.js';

const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

type ListParams = {
	page?: number | string;
	limit?: number | string;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
	[key: string]: unknown;
};

type AvailableListParams = {
	page?: number | string;
	limit?: number | string;
	search?: string;
};

export async function listCurrencies(params: ListParams): Promise<CurrenciesListResponse> {
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
	const res = await fetch(`${getApiBase()}/currencies?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<CurrenciesListResponse>;
}

export async function updateCurrency(
	id: string,
	payload: CurrencyFormPayload
): Promise<void> {
	const res = await fetch(`${getApiBase()}/currencies/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function createCurrencies(payload: CreateCurrenciesPayload): Promise<void> {
	const res = await fetch(`${getApiBase()}/currencies`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function listAvailableCurrencies(
	params: AvailableListParams
): Promise<AvailableCurrenciesResponse> {
	const searchParams = new URLSearchParams();
	if (params.page != null) searchParams.set('page', String(params.page));
	if (params.limit != null) searchParams.set('limit', String(params.limit));
	if (params.search != null) searchParams.set('search', params.search);
	const res = await fetch(`${getApiBase()}/currencies/available?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<AvailableCurrenciesResponse>;
}

export async function deleteCurrencies(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/currencies`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ currency_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}
