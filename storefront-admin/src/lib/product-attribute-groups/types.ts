export type ProductAttributeGroup = {
	id: string;
	title: string;
	metadata: unknown | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type ProductAttributeGroupAttribute = {
	id: string;
	title: string;
	type: string;
};

/** Response of GET /product-attribute-groups/:id (includes attributes) */
export type ProductAttributeGroupDetail = ProductAttributeGroup & {
	attributes: ProductAttributeGroupAttribute[];
};

export type PaginationMeta = {
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next_page: boolean;
	has_previous_page: boolean;
};

export type AttributeGroupsResponse = {
	data: { rows: ProductAttributeGroup[]; pagination: PaginationMeta };
	pagination: PaginationMeta;
};

export type ListAttributeGroupsParams = {
	page?: number;
	limit?: number;
	sorting_field?: string;
	sorting_direction?: 'asc' | 'desc';
};
