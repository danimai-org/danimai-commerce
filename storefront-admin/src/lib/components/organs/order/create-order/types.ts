export type CreateOrderItem = {
	id: string;
	title: string;
	price: number;
	quantity: number;
	currency: string;
	thumbnail: string | null;
};

export type Pagination = {
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next_page: boolean;
	has_previous_page: boolean;
};

export type Product = {
	id: string;
	title: string;
	handle: string;
	status: string;
	thumbnail: string | null;
	variants?: Array<{
		id: string;
		title: string;
		prices?: Array<{ amount: number; currency_code: string }>;
	}>;
};

export type CustomerListItem = {
	id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone: string | null;
	has_account: boolean;
	created_at: string;
};

export type SelectedCustomer = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	first_name: string | null;
	last_name: string | null;
	orderCount: number;
};

export type CurrencyRow = { id: string; code: string; name: string; symbol: string };

export type RegionRow = { id: string; name: string; currency_code: string };

export const AVAILABLE_TAGS = [
	'Line Item Discount',
	'Order Discount',
	'Custom Item',
	'Custom Shipping Rate',
	'Edited',
	'International Market',
	'Minimal Info',
	'Multiple Fulfillments',
	'Shipping Discount'
] as const;

export const CUSTOMER_SEARCH_DEBOUNCE_MS = 300;
export const PRODUCT_SEARCH_DEBOUNCE_MS = 300;
export const PRODUCT_BROWSER_PAGE_SIZE = 20;
export const PRODUCT_BROWSER_SKELETON_ROWS = 8;

export const CUSTOMER_MENU_ITEM_CLASS =
	'relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50';

export function statusBadgeClass(status: string): string {
	const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
	switch (status) {
		case 'completed':
		case 'fulfilled':
		case 'captured':
			return `${base} bg-emerald-500/15 text-emerald-700 dark:text-emerald-400`;
		case 'pending':
		case 'not_fulfilled':
		case 'not_paid':
		case 'awaiting':
			return `${base} bg-amber-500/15 text-amber-700 dark:text-amber-400`;
		default:
			return `${base} bg-muted text-muted-foreground`;
	}
}
