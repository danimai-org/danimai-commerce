import { client, type PaginatedRow, type TreatyData } from '$lib/client';

export type CreateOrderItem = {
	id: string;
	title: string;
	price: number;
	quantity: number;
	currency: string;
	thumbnail: string | null;
};

export type Pagination = NonNullable<TreatyData<typeof client.products.get>['pagination']>;

export type Product = PaginatedRow<typeof client.products.get>;

export type CustomerListItem = PaginatedRow<typeof client.customers.get>;

export type SelectedCustomer = Pick<
	CustomerListItem,
	'id' | 'email' | 'first_name' | 'last_name' | 'phone'
> & {
	name: string;
	orderCount: number;
};

export type CurrencyRow = Pick<
	PaginatedRow<typeof client.currencies.get>,
	'id' | 'code' | 'name' | 'symbol'
>;

export type RegionRow = Pick<
	PaginatedRow<typeof client.regions.get>,
	'id' | 'name' | 'currency_code'
>;

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
