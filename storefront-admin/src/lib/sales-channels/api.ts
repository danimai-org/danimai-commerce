import type { SalesChannelsResponse, SalesChannelFormPayload } from './types.js';

const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

type ListParams = {
	page: number;
	limit: number;
	sorting_field: string;
	sorting_direction: 'asc' | 'desc';
};

export async function listSalesChannels(
	params: ListParams
): Promise<SalesChannelsResponse> {
	const searchParams = new URLSearchParams({
		page: String(params.page),
		limit: String(params.limit),
		sorting_field: params.sorting_field,
		sorting_direction: params.sorting_direction
	});
	const res = await fetch(`${getApiBase()}/sales-channels?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<SalesChannelsResponse>;
}

export async function createSalesChannel(
	payload: SalesChannelFormPayload
): Promise<void> {
	const res = await fetch(`${getApiBase()}/sales-channels`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			sales_channels: [payload]
		})
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function updateSalesChannel(
	id: string,
	payload: SalesChannelFormPayload
): Promise<void> {
	const res = await fetch(`${getApiBase()}/sales-channels/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function deleteSalesChannels(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/sales-channels`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sales_channel_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}
