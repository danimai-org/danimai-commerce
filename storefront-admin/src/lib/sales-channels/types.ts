export type SalesChannel = {
	id: string;
	name: string;
	description: string | null;
	is_default: boolean;
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

export type SalesChannelsResponse = {
	data: SalesChannel[];
	pagination: Pagination;
};

export type SalesChannelFormPayload = {
	name: string;
	description: string | null;
	is_default: boolean;
};
