export const ACCOUNT_STORAGE_KEY = 'dm_sf_account';
export const ACCOUNT_UPDATED_EVENT = 'dm_sf_account_updated';
export const ORDERS_STORAGE_KEY_PREFIX = 'dm_sf_orders_';
export const ADDRESSES_STORAGE_KEY_PREFIX = 'dm_sf_addresses_';

export type StoredAccount = {
	name: string;
	email: string;
	phone?: string;
	dateOfBirth?: string;
	gender?: string;
};

export const parseStoredAccount = (raw: string | null): StoredAccount | null => {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		const name = String(parsed?.name ?? '').trim();
		const email = String(parsed?.email ?? '').trim();
		if (!email) return null;
		return {
			name: name || 'Customer',
			email,
			phone: String(parsed?.phone ?? '').trim() || undefined,
			dateOfBirth: String(parsed?.dateOfBirth ?? '').trim() || undefined,
			gender: String(parsed?.gender ?? '').trim() || undefined
		};
	} catch {
		return null;
	}
};

export const storageKeyForEmail = (prefix: string, email: string, fallback: string): string => {
	const normalized = email.trim().toLowerCase();
	return `${prefix}${normalized || fallback}`;
};

export const notifyAccountUpdated = (): void => {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new Event(ACCOUNT_UPDATED_EVENT));
};
