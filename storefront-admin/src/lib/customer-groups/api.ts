import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
import type { Customer } from '$lib/customers/api.js';

const getApiBase = () => import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export type CustomerGroup = {
	id: string;
	name: string;
	metadata: unknown | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type CustomerGroupDetail = CustomerGroup & {
	customer_count: number;
};

export type ListCustomersInGroupParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
};

export type ListCustomersInGroupResponse = {
	data: { rows: Customer[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export type ListCustomerGroupsParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
};

export type ListCustomerGroupsResponse = {
	data: { rows: CustomerGroup[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export async function listCustomerGroups(
	params: ListCustomerGroupsParams
): Promise<ListCustomerGroupsResponse> {
	const searchParams = new URLSearchParams();
	if (params.page != null) searchParams.set('page', String(params.page));
	if (params.limit != null) searchParams.set('limit', String(params.limit));
	if (params.sorting_field) searchParams.set('sorting_field', params.sorting_field);
	if (params.sorting_direction)
		searchParams.set('sorting_direction', params.sorting_direction);

	const res = await fetch(`${getApiBase()}/customer-groups?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	const raw = (await res.json()) as {
		rows?: CustomerGroup[];
		data?: CustomerGroup[];
		pagination?: PaginationMeta;
	};
	const rows = raw.data ?? raw.rows ?? [];
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

export async function createCustomerGroup(payload: { name: string }): Promise<void> {
	const res = await fetch(`${getApiBase()}/customer-groups`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ customer_groups: [payload] })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Failed to create customer group');
	}
}

export async function updateCustomerGroup(id: string, payload: { name: string }): Promise<void> {
	const res = await fetch(`${getApiBase()}/customer-groups/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error((err as { message?: string })?.message ?? 'Failed to update customer group');
	}
}

export async function deleteCustomerGroups(ids: string[]): Promise<void> {
	const res = await fetch(`${getApiBase()}/customer-groups`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ customer_group_ids: ids })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error((err as { message?: string })?.message ?? 'Failed to delete customer group(s)');
	}
}

export async function getCustomerGroup(id: string): Promise<CustomerGroupDetail> {
	const res = await fetch(`${getApiBase()}/customer-groups/${id}`, { cache: 'no-store' });
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(
			(body as { message?: string })?.message ??
				(res.status === 404 ? 'Customer group not found' : await res.text())
		);
	}
	return res.json() as Promise<CustomerGroupDetail>;
}

export async function listCustomersInGroup(
	groupId: string,
	params: ListCustomersInGroupParams
): Promise<ListCustomersInGroupResponse> {
	const searchParams = new URLSearchParams();
	if (params.page != null) searchParams.set('page', String(params.page));
	if (params.limit != null) searchParams.set('limit', String(params.limit));
	if (params.sorting_field) searchParams.set('sorting_field', params.sorting_field);
	if (params.sorting_direction)
		searchParams.set('sorting_direction', params.sorting_direction);

	const res = await fetch(`${getApiBase()}/customer-groups/${groupId}/customers?${searchParams}`, {
		cache: 'no-store'
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	const raw = (await res.json()) as {
		rows?: Customer[];
		data?: Customer[];
		pagination?: PaginationMeta;
	};
	const rows = raw.data ?? raw.rows ?? [];
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
