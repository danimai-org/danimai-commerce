import Type, { type Static } from "typebox";

export const PaginationResponseSchema = Type.Object({
    data: Type.Array(Type.Any()),
    pagination: Type.Object({
        total: Type.Number(),
        page: Type.Number(),
        limit: Type.Number(),
        total_pages: Type.Number(),
        has_next_page: Type.Boolean(),
        has_previous_page: Type.Boolean(),
    }),
});

export type PaginationResponseType<T extends any = any> = Omit<Static<typeof PaginationResponseSchema>, "data"> & { data: T[] };

