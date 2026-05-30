import type { Customer } from '$lib/customers/api.js';
import type { TableColumn } from '$lib/components/organs/index.js';

export function customersWithDisplayFields<T extends Customer>(rows: T[]) {
	return rows.map((r) => ({
		...r,
		display_name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '–',
		account_display: r.has_account ? 'Registered' : 'Guest'
	}));
}

export type CustomerTableRow = Customer & {
	display_name: string;
	account_display: string;
};

export const customerTableColumns: TableColumn<CustomerTableRow>[] = [
	{ label: 'Email', key: 'email', type: 'text' },
	{ label: 'Name', key: 'display_name', type: 'text' },
	{ label: 'Account', key: 'account_display', type: 'text' },
	{ label: 'Created', key: 'created_at', type: 'date' }
];
