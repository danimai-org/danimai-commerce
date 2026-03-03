const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export type StockLocationAddress = {
	address_1?: string | null;
	address_2?: string | null;
	company?: string | null;
	city?: string | null;
	province?: string | null;
	postal_code?: string | null;
	country_code?: string | null;
	phone?: string | null;
};

export type CreateStockLocationPayload = {
	name?: string | null;
	address?: StockLocationAddress;
};

export type UpdateStockLocationPayload = {
	name?: string | null;
	address?: StockLocationAddress;
};

export async function createStockLocation(
	payload: CreateStockLocationPayload
): Promise<void> {
	const addressFields = payload.address
		? {
				address_1: payload.address.address_1 ?? null,
				address_2: payload.address.address_2 ?? null,
				company: payload.address.company ?? null,
				city: payload.address.city ?? null,
				province: payload.address.province ?? null,
				postal_code: payload.address.postal_code ?? null,
				country_code: payload.address.country_code ?? null,
				phone: payload.address.phone ?? null
			}
		: undefined;
	const hasAddress =
		addressFields && Object.values(addressFields).some((v) => v != null && v !== '');
	const body: { name: string | null; address?: StockLocationAddress } = {
		name: payload.name?.trim() ?? null
	};
	if (hasAddress && addressFields) body.address = addressFields;

	const res = await fetch(`${getApiBase()}/stock-locations`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ stock_locations: [body] })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function updateStockLocation(
	id: string,
	payload: UpdateStockLocationPayload
): Promise<void> {
	const addressFields = payload.address
		? {
				address_1: payload.address.address_1 ?? null,
				address_2: payload.address.address_2 ?? null,
				company: payload.address.company ?? null,
				city: payload.address.city ?? null,
				province: payload.address.province ?? null,
				postal_code: payload.address.postal_code ?? null,
				country_code: payload.address.country_code ?? null,
				phone: payload.address.phone ?? null
			}
		: undefined;
	const hasAddress =
		addressFields && Object.values(addressFields).some((v) => v != null && v !== '');
	const body: { name?: string | null; address?: StockLocationAddress } = {
		name: payload.name?.trim() ?? null
	};
	if (hasAddress && addressFields) body.address = addressFields;

	const res = await fetch(`${getApiBase()}/stock-locations/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function deleteStockLocations(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/stock-locations`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ stock_location_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

