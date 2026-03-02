export type Product = {
	id: string;
	title: string;
	handle: string;
	subtitle?: string | null;
	description?: string | null;
	status: string;
	thumbnail: string | null;
	category_id?: string | null;
	category?: { id: string; value: string; handle: string } | null;
	created_at?: string;
	updated_at?: string;
	sales_channels?: Array<{ id: string; name: string }>;
	variants?: Array<{ id: string }>;
};

export type PaginationMeta = {
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next_page: boolean;
	has_previous_page: boolean;
};

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
