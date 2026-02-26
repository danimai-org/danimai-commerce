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
    data: Type.Array(Type.Any()),
    pagination: PaginationMetaSchema,
});

export type PaginationResponseType<T extends any = any> = Omit<Static<typeof PaginationResponseSchema>, "data"> & { data: T[] };

export function createPaginatedResponseSchema(itemSchema: TSchema) {
    return Type.Object({
        data: Type.Array(itemSchema),
        pagination: PaginationMetaSchema,
    });
}

