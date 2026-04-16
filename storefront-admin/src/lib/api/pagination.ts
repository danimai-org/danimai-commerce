import type { PaginationResponseType } from '@danimai/backend';

export function createPaginationResponse<T>(data: PaginationResponseType<T>) {
    const start = data.pagination ? (data.pagination.page - 1) * data.pagination.limit + 1 : 0;
    const end = data.pagination ? Math.min(data.pagination.page * data.pagination.limit, data.pagination.total) : 0;

    return {
        ...data,
        pagination: {
            ...data.pagination,
            start,
            end,
        },
    };
}