export type ProductCategory = {
	id: string;
	value: string;
	handle: string;
	metadata: unknown | null;
	parent_id: string | null;
	status: string;
	visibility: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type PaginationMeta = {
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next_page: boolean;
	has_previous_page: boolean;
};

export type CategoriesListResponse = {
	data: { rows: ProductCategory[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export type ListCategoriesParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
};
