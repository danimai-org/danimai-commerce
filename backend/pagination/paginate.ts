import type { PaginationResponseType } from "./response";
import type { PaginationType } from "./schema";


export function paginationResponse<T>(rows: T[], total: number, pagination: PaginationType): PaginationResponseType<T> {
    return {
        pagination: {
            total: total,
            page: Number(pagination.page ?? 1),
            limit: Number(pagination.limit ?? 10),
            total_pages: Math.ceil(total / (Number(pagination.limit ?? 10))),
            has_next_page: (Number(pagination.page ?? 1)) < Math.ceil(total / (Number(pagination.limit ?? 10))),
            has_previous_page: (Number(pagination.page ?? 1)) > 1,
        },
    rows,
    };
}