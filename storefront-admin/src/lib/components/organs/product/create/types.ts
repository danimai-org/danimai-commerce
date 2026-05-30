import { client, type PaginatedRow, type TreatyData } from '$lib/client';

export type Product = PaginatedRow<typeof client.products.get>;

export type PaginationMeta = NonNullable<TreatyData<typeof client.products.get>['pagination']>;

export type ProductsListResponse = {
	data: { rows: Product[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export type ListProductsParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
	search?: string;
	category_ids?: string[];
};
