import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
import { client, type DetailById, type PaginatedRow } from '$lib/client.js';

const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export type Customer = PaginatedRow<typeof client.customers.get>;

export type CustomerDetail = DetailById<typeof client.customers>;

export type CustomerAddress = NonNullable<
	NonNullable<
		Awaited<ReturnType<ReturnType<typeof client.customers>['addresses']['get']>>['data']
	>['rows']
>[number];

export type ListCustomersParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
};

export type ListCustomersResponse = {
	data: { rows: Customer[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export async function listCustomers(
	params: ListCustomersParams
): Promise<ListCustomersResponse> {
	const searchParams = new URLSearchParams();
	if (params.page != null) searchParams.set('page', String(params.page));
	if (params.limit != null) searchParams.set('limit', String(params.limit));
	if (params.sorting_field) searchParams.set('sorting_field', params.sorting_field);
	if (params.sorting_direction)
		searchParams.set('sorting_direction', params.sorting_direction);

	const res = await fetch(`${getApiBase()}/customers?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	const raw = (await res.json()) as { rows?: Customer[]; pagination?: PaginationMeta };
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

type CustomersPostBody = Parameters<typeof client.customers.post>[0];

export type CreateCustomerPayload = CustomersPostBody extends {
	customers: (infer Row)[];
}
	? Row
	: never;

export async function createCustomers(
	customers: CreateCustomerPayload[]
): Promise<Customer[]> {
	const res = await fetch(`${getApiBase()}/customers`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ customers })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<Customer[]>;
}

export type UpdateCustomerPayload = Pick<
	CustomerDetail,
	'email' | 'first_name' | 'last_name' | 'phone'
> & {
	metadata?: Record<string, unknown> | null;
};

export async function updateCustomer(
	id: string,
	body: UpdateCustomerPayload
): Promise<Customer> {
	const res = await fetch(`${getApiBase()}/customers/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<Customer>;
}

export async function deleteCustomers(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/customers`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ customer_ids: ids })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
	const res = await fetch(`${getApiBase()}/customers/${id}`, { cache: 'no-store' });
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		const msg = (body as { message?: string })?.message ?? (res.status === 404 ? 'Customer not found' : await res.text());
		throw new Error(msg);
	}
	return res.json() as Promise<CustomerDetail>;
}

export async function listCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
	const res = await fetch(`${getApiBase()}/customers/${customerId}/addresses`, { cache: 'no-store' });
	if (!res.ok) return [];
	const data = (await res.json()) as { rows?: CustomerAddress[] } | CustomerAddress[];
	if (Array.isArray(data)) return data;
	return data.rows ?? [];
}

export async function addCustomerToGroup(customerId: string, customerGroupId: string): Promise<void> {
	const res = await fetch(`${getApiBase()}/customers/${customerId}/customer-groups`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ customer_group_id: customerGroupId })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error((err as { message?: string })?.message ?? 'Failed to add customer to group');
	}
}

export async function removeCustomerFromGroup(
	customerId: string,
	customerGroupId?: string
): Promise<void> {
	const url =
		customerGroupId != null
			? `${getApiBase()}/customers/${customerId}/customer-groups?customer_group_id=${encodeURIComponent(customerGroupId)}`
			: `${getApiBase()}/customers/${customerId}/customer-groups`;
	const res = await fetch(url, { method: 'DELETE' });
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error((err as { message?: string })?.message ?? 'Failed to remove from group');
	}
}

export type CreateCustomerAddressPayload = Parameters<
	ReturnType<typeof client.customers>['addresses']['post']
>[0];

export async function createCustomerAddress(
	customerId: string,
	body: CreateCustomerAddressPayload
): Promise<CustomerAddress> {
	const res = await fetch(`${getApiBase()}/customers/${customerId}/addresses`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...body, customer_id: customerId })
	});
	if (!res.ok) {
		const text = await res.text();
		let message: string | null = null;
		try {
			const err = JSON.parse(text) as { message?: string };
			message = err?.message ?? null;
		} catch {
			message = text || null;
		}
		throw new Error(message ?? `Request failed (${res.status})`);
	}
	return res.json() as Promise<CustomerAddress>;
}

export type UpdateCustomerAddressPayload = Parameters<
	ReturnType<ReturnType<typeof client.customers>['addresses']>['put']
>[0];

export async function updateCustomerAddress(
	customerId: string,
	addressId: string,
	body: UpdateCustomerAddressPayload
): Promise<CustomerAddress> {
	const res = await fetch(`${getApiBase()}/customers/${customerId}/addresses/${addressId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		let message: string | null = null;
		try {
			const err = JSON.parse(text) as { message?: string };
			message = err?.message ?? null;
		} catch {
			message = text || null;
		}
		throw new Error(message ?? `Request failed (${res.status})`);
	}
	return res.json() as Promise<CustomerAddress>;
}

export async function deleteCustomerAddress(
	customerId: string,
	addressId: string
): Promise<void> {
	const res = await fetch(`${getApiBase()}/customers/${customerId}/addresses/${addressId}`, {
		method: 'DELETE'
	});
	if (!res.ok) {
		const text = await res.text();
		let message: string | null = null;
		try {
			const err = JSON.parse(text) as { message?: string };
			message = err?.message ?? null;
		} catch {
			message = text || null;
		}
		throw new Error(message ?? 'Failed to delete address');
	}
}

export async function deleteCustomer(id: string): Promise<void> {
	await deleteCustomers([id]);
}
