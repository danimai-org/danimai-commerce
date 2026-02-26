import { Type, type Static } from "@sinclair/typebox";

export enum SortOrder {
    ASC = "asc",
    DESC = "desc",
}

function coercePage(value: unknown): number {
    if (value === undefined || value === null || value === "") return 1;
    const n = typeof value === "string" ? parseInt(value, 10) : value;
    const num = typeof n === "number" && !Number.isNaN(n) ? n : 1;
    return Math.max(1, num);
}

function coerceLimit(value: unknown): number {
    if (value === undefined || value === null || value === "") return 10;
    const n = typeof value === "string" ? parseInt(value, 10) : value;
    const num = typeof n === "number" && !Number.isNaN(n) ? n : 10;
    return Math.max(1, Math.min(100, num));
}

export const PaginationSchema = Type.Object({
    page: Type.Optional(
        Type.Transform(Type.Union([Type.String(), Type.Integer()]))
            .Decode(coercePage)
            .Encode((v: number) => v)
    ),
    limit: Type.Optional(
        Type.Transform(Type.Union([Type.String(), Type.Integer()]))
            .Decode(coerceLimit)
            .Encode((v: number) => v)
    ),
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

/** Query-only schema without Type.Transform for Elysia/TypeBox preflight validation. */
export const PaginationQuerySchema = Type.Object({
    page: Type.Optional(Type.Union([Type.String(), Type.Integer()])),
    limit: Type.Optional(Type.Union([Type.String(), Type.Integer()])),
    sorting_direction: Type.Optional(Type.Enum(SortOrder, {
        default: SortOrder.DESC,
    })),
    sorting_field: Type.Optional(Type.String({
        default: "created_at",
    })),
    search: Type.Optional(Type.String({
        default: "",
    })),
    search_fields: Type.Optional(Type.Array(Type.String())),
});