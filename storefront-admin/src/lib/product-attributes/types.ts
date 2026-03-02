export type ProductAttribute = {
	id: string;
	title: string;
	type: string;
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

export type AttributesResponse = {
	data: { rows: ProductAttribute[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export type ListAttributesParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
};
