import { browser } from '$app/environment';
import { client } from '$lib/api/client';
import { rowsFromPaginated } from '$lib/api/storefront-api';
import type {
	CustomerAddressRow,
	CustomerAuthTokens,
	CustomerMe,
} from '$lib/types/customer';

export const ACCOUNT_STORAGE_KEY = 'dm_sf_account';
export const ACCOUNT_UPDATED_EVENT = 'dm_sf_account_updated';
export const ORDERS_STORAGE_KEY_PREFIX = 'dm_sf_orders_';
export const CUSTOMER_AUTH_STORAGE_KEY = 'dm_sf_customer_auth';

export type StoredAccount = {
	name: string;
	email: string;
	phone?: string;
	dateOfBirth?: string;
	gender?: string;
};

export type { CustomerAuthTokens };

export type CustomerSavedAddress = {
	id: string;
	name: string;
	line1: string;
	line2: string;
	city: string;
	state: string;
	postal: string;
	countryCode: string;
	phone: string;
	isDefault: boolean;
};

export type CustomerAddressFormInput = {
	name: string;
	line1: string;
	line2: string;
	city: string;
	state: string;
	postal: string;
	phone: string;
	isDefault: boolean;
};

type StoredAuth = CustomerAuthTokens & { expires_at?: number };

const DEFAULT_COUNTRY_CODE = 'IN';

export class CustomerAuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CustomerAuthError';
	}
}

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

export const treatyErrorMessage = (err: unknown, fallback = 'Request failed'): string => {
	const o = err as { value?: { message?: string } };
	return o?.value?.message ?? fallback;
};

const readStoredAuth = (): StoredAuth | null => {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(CUSTOMER_AUTH_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as StoredAuth;
		if (!parsed.access_token || !parsed.refresh_token) return null;
		return parsed;
	} catch {
		return null;
	}
};

export const getCustomerAccessToken = (): string | null => {
	const stored = readStoredAuth();
	if (!stored?.access_token) return null;
	if (stored.expires_at != null && stored.expires_at <= Date.now()) {
		return null;
	}
	return stored.access_token;
};

export const hasCustomerAuthSession = (): boolean => {
	const stored = readStoredAuth();
	return Boolean(stored?.access_token && stored?.refresh_token);
};

export const setCustomerAuthTokens = (tokens: CustomerAuthTokens): void => {
	if (!browser) return;
	const expires_at =
		tokens.expires_in != null ? Date.now() + tokens.expires_in * 1000 : undefined;
	localStorage.setItem(
		CUSTOMER_AUTH_STORAGE_KEY,
		JSON.stringify({ ...tokens, expires_at })
	);
};

export const clearCustomerAuth = (): void => {
	if (!browser) return;
	localStorage.removeItem(CUSTOMER_AUTH_STORAGE_KEY);
};

export const customerAuthHeaders = (): Record<string, string> | null => {
	const token = getCustomerAccessToken();
	if (!token) return null;
	return { Authorization: `Bearer ${token}` };
};

export const refreshCustomerAccessToken = async (): Promise<string | null> => {
	if (!browser) return null;
	const stored = readStoredAuth();
	if (!stored?.refresh_token) return null;

	const res = await client.storefront.auth.refresh.post({
		refresh_token: stored.refresh_token
	});
	if (res.error || !res.data) {
		clearCustomerAuth();
		return null;
	}

	const data = res.data;
	setCustomerAuthTokens(data);
	return data.access_token;
};

const resolveAuthHeaders = async (
	retryOnUnauthorized = true
): Promise<Record<string, string>> => {
	let headers = customerAuthHeaders();
	if (headers) return headers;

	if (!retryOnUnauthorized) {
		throw new CustomerAuthError('Please log in to manage your addresses.');
	}

	const refreshed = await refreshCustomerAccessToken();
	headers = refreshed ? { Authorization: `Bearer ${refreshed}` } : null;
	if (!headers) {
		throw new CustomerAuthError('Please log in to manage your addresses.');
	}
	return headers;
};

const isUnauthorized = (status: number | undefined): boolean => status === 401;

export const splitFullName = (name: string): { first_name: string; last_name: string | null } => {
	const trimmed = name.trim();
	if (!trimmed) return { first_name: '', last_name: null };
	const space = trimmed.indexOf(' ');
	if (space === -1) return { first_name: trimmed, last_name: null };
	return {
		first_name: trimmed.slice(0, space).trim(),
		last_name: trimmed.slice(space + 1).trim() || null
	};
};

export const displayNameFromApi = (
	first_name: string | null | undefined,
	last_name: string | null | undefined
): string => [first_name, last_name].filter(Boolean).join(' ').trim();

export const apiAddressToSaved = (row: CustomerAddressRow): CustomerSavedAddress => ({
	id: row.id,
	name: displayNameFromApi(row.first_name, row.last_name) || row.address_1,
	line1: row.address_1,
	line2: row.address_2 ?? '',
	city: row.city,
	state: row.province ?? '',
	postal: row.postal_code ?? '',
	countryCode: row.country_code ?? DEFAULT_COUNTRY_CODE,
	phone: row.phone ?? '',
	isDefault: row.is_default
});

export const savedAddressToFormInput = (
	entry: CustomerSavedAddress,
	isDefault = entry.isDefault
): CustomerAddressFormInput => ({
	name: entry.name,
	line1: entry.line1,
	line2: entry.line2,
	city: entry.city,
	state: entry.state,
	postal: entry.postal,
	phone: entry.phone,
	isDefault
});

export const formInputToApiBody = (values: CustomerAddressFormInput) => {
	const { first_name, last_name } = splitFullName(values.name);
	return {
		first_name,
		last_name,
		phone: values.phone.trim() || null,
		address_1: values.line1.trim(),
		address_2: values.line2.trim() || null,
		city: values.city.trim(),
		province: values.state.trim() || null,
		postal_code: values.postal.trim() || null,
		country_code: DEFAULT_COUNTRY_CODE,
		is_default: values.isDefault
	};
};

export async function syncAccountFromApi(): Promise<StoredAccount | null> {
	if (!browser) return null;
	const headers = customerAuthHeaders();
	if (!headers) return null;

	const res = await client.storefront.auth.me.get({ headers });
	if (res.error || !res.data) return null;

	const customer = res.data as CustomerMe;
	const name =
		displayNameFromApi(customer.first_name, customer.last_name) || 'Customer';
	const account: StoredAccount = {
		name,
		email: customer.email,
		phone: customer.phone ?? undefined
	};
	localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
	return account;
}

export async function logoutCustomerSession(): Promise<void> {
	if (!browser) return;
	const headers = customerAuthHeaders();
	if (headers) {
		try {
			await client.storefront.auth.logout.post({}, { headers });
		} catch {
			// best-effort
		}
	}
	clearCustomerAuth();
}

export async function listCustomerAddresses(
	retried = false
): Promise<CustomerSavedAddress[]> {
	const headers = await resolveAuthHeaders();
	const rows: CustomerAddressRow[] = [];
	let page = 1;
	const limit = 100;

	for (;;) {
		const res = await client.storefront.customers.me.addresses.get({
			query: { page, limit },
			headers
		});

		const errorStatus = (res.error as { status?: number } | undefined)?.status;
		if (isUnauthorized(errorStatus)) {
			if (!retried) {
				const refreshed = await refreshCustomerAccessToken();
				if (refreshed) {
					return listCustomerAddresses(true);
				}
			}
			throw new CustomerAuthError('Please log in to manage your addresses.');
		}

		if (res.error) {
			throw new Error(treatyErrorMessage(res.error, 'Failed to load addresses'));
		}

		const { rows: pageRows } = rowsFromPaginated<CustomerAddressRow>(res.data);
		rows.push(...pageRows);

		const pagination = (res.data as { pagination?: { has_next_page?: boolean } })
			?.pagination;
		if (!pagination?.has_next_page) break;
		page += 1;
		if (page > 500) break;
	}

	return rows.map(apiAddressToSaved).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

export async function ensureCustomerDefaultAddress(
	items: CustomerSavedAddress[]
): Promise<CustomerSavedAddress[]> {
	if (items.length === 0 || items.some((entry) => entry.isDefault)) {
		return items;
	}
	const next = items[0];
	await setDefaultCustomerAddress(next.id, savedAddressToFormInput(next, true));
	return listCustomerAddresses();
}

export async function createCustomerAddress(
	values: CustomerAddressFormInput,
	retried = false
): Promise<CustomerSavedAddress> {
	const headers = await resolveAuthHeaders();
	const res = await client.storefront.customers.me.addresses.post(formInputToApiBody(values), {
		headers
	});

	const errorStatus = (res.error as { status?: number } | undefined)?.status;
	if (isUnauthorized(errorStatus)) {
		if (!retried) {
			const refreshed = await refreshCustomerAccessToken();
			if (refreshed) {
				return createCustomerAddress(values, true);
			}
		}
		throw new CustomerAuthError('Please log in to manage your addresses.');
	}
	if (res.error || !res.data) {
		throw new Error(treatyErrorMessage(res.error, 'Failed to save address'));
	}

	return apiAddressToSaved(res.data as CustomerAddressRow);
}

export async function updateCustomerAddress(
	addressId: string,
	values: CustomerAddressFormInput,
	retried = false
): Promise<CustomerSavedAddress> {
	const headers = await resolveAuthHeaders();
	const res = await client.storefront.customers.me
		.addresses({ addressId })
		.put(formInputToApiBody(values), { headers });

	const errorStatus = (res.error as { status?: number } | undefined)?.status;
	if (isUnauthorized(errorStatus)) {
		if (!retried) {
			const refreshed = await refreshCustomerAccessToken();
			if (refreshed) {
				return updateCustomerAddress(addressId, values, true);
			}
		}
		throw new CustomerAuthError('Please log in to manage your addresses.');
	}
	if (res.error || !res.data) {
		throw new Error(treatyErrorMessage(res.error, 'Failed to update address'));
	}

	return apiAddressToSaved(res.data as CustomerAddressRow);
}

export async function deleteCustomerAddress(
	addressId: string,
	retried = false
): Promise<void> {
	const headers = await resolveAuthHeaders();
	const res = await client.storefront.customers.me
		.addresses({ addressId })
		.delete({}, { headers });

	const errorStatus = (res.error as { status?: number } | undefined)?.status;
	if (isUnauthorized(errorStatus)) {
		if (!retried) {
			const refreshed = await refreshCustomerAccessToken();
			if (refreshed) {
				return deleteCustomerAddress(addressId, true);
			}
		}
		throw new CustomerAuthError('Please log in to manage your addresses.');
	}
	if (res.error) {
		throw new Error(treatyErrorMessage(res.error, 'Failed to delete address'));
	}
}

export async function setDefaultCustomerAddress(
	addressId: string,
	values: CustomerAddressFormInput
): Promise<CustomerSavedAddress> {
	return updateCustomerAddress(addressId, { ...values, isDefault: true });
}
