import { Type, type Static, type TSchema } from "@sinclair/typebox";

const PaginationMetaSchema = Type.Object({
    total: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
    total_pages: Type.Number(),
    has_next_page: Type.Boolean(),
    has_previous_page: Type.Boolean(),
});

export const PaginationResponseSchema = Type.Object({
    rows: Type.Array(Type.Any()),
    pagination: PaginationMetaSchema,
});

export type PaginationResponseType<T extends any = any> = Omit<Static<typeof PaginationResponseSchema>, "rows"> & { rows: T[] };

export function createPaginatedResponseSchema<T extends TSchema>(itemSchema: T) {
    return Type.Object({
        rows: Type.Array(itemSchema),
        pagination: PaginationMetaSchema,
    });
}

