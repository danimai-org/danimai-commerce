export type TaxRegion = {
	id: string;
	name: string;
	tax_provider_id: string | null;
	parent_id: string | null;
	metadata: unknown | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type Pagination = {
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next_page: boolean;
	has_previous_page: boolean;
};

export type TaxRegionsListResponse = {
	rows: TaxRegion[];
	pagination: Pagination;
};

export type TaxRegionFormPayload = {
	name: string;
	tax_provider_id: string | null;
};
