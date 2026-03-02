export type PriceListType = 'sale' | 'override';
export type PriceListStatus = 'active' | 'draft';

export type PriceList = {
	id: string;
	name: string;
	description: string | null;
	type: PriceListType;
	status: PriceListStatus;
	starts_at: string | null;
	ends_at: string | null;
	created_at: string;
	updated_at: string;
};

const STORAGE_KEY = 'price-lists';

export function loadPriceLists(): PriceList[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch (e) {
		console.error('Failed to load price lists:', e);
	}
	return [];
}

export function savePriceLists(list: PriceList[]) {
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
		} catch (e) {
			console.error('Failed to save price lists:', e);
		}
	}
}

export function generateId() {
	return crypto.randomUUID?.() ?? `pl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function deletePriceList(pl: PriceList): Promise<void> {
	const list = loadPriceLists().filter((p) => p.id !== pl.id);
	savePriceLists(list);
	return Promise.resolve();
}
