import { Type } from "@sinclair/typebox";

export enum FilterOperator {
    EQUAL = "equal",
    NOT_EQUAL = "not_equal",
    CONTAINS = "contains",
    NOT_CONTAINS = "not_contains",
    STARTS_WITH = "starts_with",
    ENDS_WITH = "ends_with",
    IN = "in",
    NOT_IN = "not_in",
    IS_NULL = "is_null",
    IS_NOT_NULL = "is_not_null",
}

export type FilterableColumn<T extends string> = Record<T,
    FilterOperator[] | true
>;

export const createFilterableColumnsSchema = <T extends string>(columns: FilterableColumn<T>) => Type.Union(Object.keys(columns).map((column) => Type.Object({
    [column]: Type.Union([Type.String(), Type.Union([Type.Boolean(), Type.Array(Type.Enum(FilterOperator))])]),
})),
);

export const createConditionsFromFilterableColumns = (columns: FilterableColumn<string>) => {
    const conditions: Record<string, any> = {};
};