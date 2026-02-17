import { Type, type Static } from "typebox";
import {
  createFilterableColumnsSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { Product } from "../../../db/type";

export const PaginatedProductsSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    category_id: Type.Optional(Type.String()),
    search: Type.Optional(Type.String()),
    filters: Type.Optional(
      createFilterableColumnsSchema<
        keyof Pick<Product, "title" | "handle" | "status" | "category_id">
      >({
        title: true,
        handle: true,
        status: [
          FilterOperator.EQUAL,
          FilterOperator.NOT_EQUAL,
          FilterOperator.IN,
          FilterOperator.NOT_IN,
        ],
        category_id: [
          FilterOperator.EQUAL,
          FilterOperator.NOT_EQUAL,
          FilterOperator.IS_NULL,
          FilterOperator.IS_NOT_NULL,
        ],
      }),
    ),
  }),
]);

export type PaginatedProductsProcessInput = Static<
  typeof PaginatedProductsSchema
>;
