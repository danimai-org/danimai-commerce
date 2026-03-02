import type { PaginationMeta } from '$lib/product-categories/types.js';

export type ProductCollection = {
	id: string;
	title: string;
	handle: string;
	metadata: unknown | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	product_count?: number;
	
};

export type CollectionsListResponse = {
	data: { rows: ProductCollection[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export type ListCollectionsParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
	search?: string;
	sales_channel_ids?: string[];
	collection_type?: string[];
};

