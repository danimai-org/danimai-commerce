import { Type, type Static, type TObject, type TSchema, type StaticDecode } from "@sinclair/typebox";

export enum SortOrder {
    ASC = "asc",
    DESC = "desc",
}

function coercePage(value: string | number): number {
    if (value === undefined || value === null || value === "") return 1;
    const n = typeof value === "string" ? parseInt(value, 10) : value;
    const num = typeof n === "number" && !Number.isNaN(n) ? n : 1;
    return Math.max(1, num);
}

function coerceLimit(value: string | number): number {
    if (value === undefined || value === null || value === "") return 10;
    const n = typeof value === "string" ? parseInt(value, 10) : value;
    const num = typeof n === "number" && !Number.isNaN(n) ? n : 10;
    return Math.max(1, Math.min(100, num));
}

export const PaginationSchema = Type.Object({
    page: Type.Optional(
        Type.Transform(Type.Union([Type.String(), Type.Integer()]))
            .Decode(coercePage)
            .Encode((v: number) => v ?? 1)
    ),
    limit: Type.Optional(
        Type.Transform(Type.Union([Type.String(), Type.Integer()]))
            .Decode(coerceLimit)
            .Encode((v: number) => v)
    ),
    search: Type.Optional(Type.Transform(Type.String()).Decode((v: string) => v?.trim() ?? "").Encode((v: string) => v?.trim() ?? "")),
});

export const createPaginationSchema = <T extends TSchema>(
    filter_schema: T,
    sorting_fields: string[],
) => Type.Intersect([
    PaginationSchema,
    Type.Object({
        sorting_direction: Type.Optional(Type.Enum(SortOrder, {
            default: SortOrder.DESC,
        })),
        sorting_field: Type.Optional(Type.String({
            default: sorting_fields[0],
            enum: sorting_fields,
        })),
    }),
    Type.Object({
        filters: Type.Optional(filter_schema),
    }),
]);

export type PaginationType = StaticDecode<typeof PaginationSchema>;