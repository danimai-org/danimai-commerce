export type ProductTag = {
	id: string;
	value: string;
	metadata: unknown | null;
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

export type TagsResponse = {
	data: { rows: ProductTag[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export type ListTagsParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
};
