import { createQuery, type QueryFunction } from "@tanstack/svelte-query";
import { PaginationSchema } from "@danimai/backend";
import { type Static } from "@sinclair/typebox";

/**
 * Pagination meta returned by list APIs. Use createPaginationQuery(url.searchParams)
 * for the request and createPagination<T>(queryFn, queryKey) for state and actions.
 */
export type PaginationMeta = {
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	has_next_page: boolean;
	has_previous_page: boolean;
};

export type PaginatedResponse<T> = { data: T[]; pagination: PaginationMeta };

const searchParamsToObject = (searchParams: URLSearchParams) => {
	return Object.fromEntries(searchParams.entries());
};

export const createPaginationQuery = <T extends Static<typeof PaginationSchema>>(data: URLSearchParams | T) => {
	const searchParams = data instanceof URLSearchParams ? searchParamsToObject(data) : data;
	return searchParams;
};

export type CreatePaginationOptions = {
	enabled?: () => boolean;
	queryKeyPart?: () => unknown[];
};

export const createPagination = <T>(
	queryFn: QueryFunction<T>,
	queryKey: string[],
	initialSearchQuery?: ReturnType<typeof createPaginationQuery>,
	options?: CreatePaginationOptions
	) => {
	let searchText = $state<string>(initialSearchQuery?.search ?? "");
	const form = $state({
		sheetOpen: false,
		mode: "create" as "create" | "edit",
		item: null as T | null,
	});
	const deleteState = $state({
		confirmOpen: false,
		submitting: false,
		item: null as T | null,
		error: null as string | null,
	});

	const query = createQuery(() => ({
		queryKey: ["pagination", ...queryKey, searchText, ...(options?.queryKeyPart?.() ?? [])],
		queryFn,
		enabled: options?.enabled?.() ?? true,
	}));

	const pagination = $derived(query.data?.pagination ?? null);
	const loading = $derived(query.isPending);
	const error = $derived(
		query.error != null ? (query.error instanceof Error ? query.error.message : String(query.error)) : null
	);
	const start = $derived(
		pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	function openCreate() {
		form.mode = "create";
		form.item = null;
		form.sheetOpen = true;
	}

	function openEdit(item: T) {
		form.mode = "edit";
		form.item = item;
		form.sheetOpen = true;
	}

	function closeForm() {
		form.sheetOpen = false;
		form.item = null;
	}

	function openDeleteConfirm(item: T) {
		deleteState.item = item;
		deleteState.error = null;
		deleteState.confirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteState.submitting) {
			deleteState.confirmOpen = false;
			deleteState.item = null;
			deleteState.error = null;
		}
	}

	async function confirmDelete(deleteFn: (item: T) => Promise<void>) {
		if (deleteState.item == null) return;
		deleteState.submitting = true;
		deleteState.error = null;
		try {
			await deleteFn(deleteState.item);
			deleteState.confirmOpen = false;
			deleteState.item = null;
			query.refetch();
		} catch (e) {
			deleteState.error = e instanceof Error ? e.message : String(e);
		} finally {
			deleteState.submitting = false;
		}
	}


	return {
		get query() {
			return query;
		},
		get pagination() {
			return pagination;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get start() {
			return start;
		},
		get end() {
			return end;
		},
		get formSheetOpen() {
			return form.sheetOpen;
		},
		set formSheetOpen(value: boolean) {
			form.sheetOpen = value;
		},
		get formMode() {
			return form.mode;
		},
		get formItem() {
			return form.item;
		},
		get openCreate() {
			return openCreate;
		},
		get openEdit() {
			return openEdit;
		},
		get closeForm() {
			return closeForm;
		},
		get deleteConfirmOpen() {
			return deleteState.confirmOpen;
		},
		set deleteConfirmOpen(value: boolean) {
			deleteState.confirmOpen = value;
		},
		get deleteSubmitting() {
			return deleteState.submitting;
		},
		get deleteItem() {
			return deleteState.item;
		},
		get deleteError() {
			return deleteState.error;
        },
        get searchText() {
            return searchText;
        },
        set searchText(value: string) {
            searchText = value;
        },
		get openDeleteConfirm() {
			return openDeleteConfirm;
		},
		get closeDeleteConfirm() {
			return closeDeleteConfirm;
		},
		get confirmDelete() {
			return confirmDelete;
		},
		get refetch() {
			return query.refetch;
		},
	};
};
