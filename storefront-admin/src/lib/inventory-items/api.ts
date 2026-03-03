const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export type CreateInventoryItemPayload = {
	sku?: string | null;
	requires_shipping?: boolean;
};

export async function createInventoryItems(
	items: CreateInventoryItemPayload[]
): Promise<void> {
	const res = await fetch(`${getApiBase()}/inventory/items`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ inventory_items: items })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function deleteInventoryItems(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/inventory/items`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ inventory_item_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		let message = text;
		try {
			const json = JSON.parse(text) as { message?: string };
			if (json.message) message = json.message;
		} catch {
			// use text as-is
		}
		throw new Error(message);
	}
}
