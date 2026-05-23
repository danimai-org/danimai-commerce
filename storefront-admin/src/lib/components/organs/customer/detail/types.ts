import type { Customer } from '$lib/customers/api.js';

export type CustomerGroupItem = { id: string | null; name: string };

export function customerGroupsFromMetadata(customer: Customer | null): CustomerGroupItem[] {
	const meta = customer?.metadata;
	if (!meta || typeof meta !== 'object' || meta === null) return [];
	const m = meta as {
		customer_groups?: { id: string; name: string }[];
		customer_group_name?: string;
	};
	if (Array.isArray(m.customer_groups) && m.customer_groups.length > 0) {
		return m.customer_groups.map((g) => ({ id: g.id, name: g.name }));
	}
	if (typeof m.customer_group_name === 'string' && m.customer_group_name) {
		return [{ id: null, name: m.customer_group_name }];
	}
	return [];
}
