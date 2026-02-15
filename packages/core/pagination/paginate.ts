import type { PaginationResponseType } from "./response";
import type { PaginationType } from "./schema";


export function paginationResponse<T>(data: T[], total: number, pagination: PaginationType): PaginationResponseType {
    return {
        pagination: {
            total: total,
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 10,
            total_pages: Math.ceil(total / (pagination.limit ?? 10)),
            has_next_page: (pagination.page ?? 1) < Math.ceil(total / (pagination.limit ?? 10)),
            has_previous_page: (pagination.page ?? 1) > 1,
        },
        data,

    };
}