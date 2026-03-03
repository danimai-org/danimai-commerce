export type Currency = {
	id: string;
	code: string;
	name: string;
	symbol: string;
	symbol_native: string;
	tax_inclusive_pricing: boolean;
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

export type CurrenciesListResponse = {
	rows: Currency[];
	pagination: Pagination;
};

export type AvailableCurrency = {
	code: string;
	name: string;
	symbol: string;
	symbol_native: string;
	active: boolean;
	id?: string;
	tax_inclusive_pricing: boolean;
};

export type AvailableCurrenciesResponse = {
	data: AvailableCurrency[];
	pagination: Pagination;
};

export type CurrencyFormPayload = {
	tax_inclusive_pricing: boolean;
};

export type CreateCurrencyItem = {
	code: string;
	tax_inclusive_pricing: boolean;
};

export type CreateCurrenciesPayload = {
	currencies: CreateCurrencyItem[];
};
