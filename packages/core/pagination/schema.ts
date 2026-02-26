import { Type, type Static } from "@sinclair/typebox";

export enum SortOrder {
    ASC = "asc",
    DESC = "desc",
}

export const PaginationSchema = Type.Object({
    page: Type.Optional(Type.Integer({
        minimum: 1,
        default: 1,
    })),
    limit: Type.Optional(Type.Integer({
        minimum: 1,
        default: 10,
        maximum: 100,
    })),
    sorting_direction: Type.Optional(Type.Enum(SortOrder, {
        default: SortOrder.DESC,
    })),
    sorting_field: Type.Optional(Type.String({
        default: "created_at",
    })),
    search: Type.Optional(Type.String({
        default: "",
    })),
    search_fields: Type.Optional(Type.Array(Type.String({
        default: [],
    })))
});

export type PaginationType = Static<typeof PaginationSchema>;