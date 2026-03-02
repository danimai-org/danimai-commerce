import { Type, type Static, type TSchema } from "@sinclair/typebox";

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
   
    search: Type.Optional(Type.String({
        default: "",
    })),
});

export const createPaginationSchema = ({
    filter_schema,
    sorting_fields,
}: {
    filter_schema: TSchema,
    sorting_fields: Record<string, string>
}) => Type.Intersect([
    PaginationSchema,
    Type.Object({
        sorting_direction: Type.Optional(Type.Enum(SortOrder, {
            default: SortOrder.DESC,
        })),
        sorting_field: Type.Optional(Type.Enum(sorting_fields, {
            default: Object.keys(sorting_fields)[0],
        })),
    }),
    filter_schema,
]);

export type PaginationType = Static<typeof PaginationSchema>;