import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
  PaginationSchema,
} from "@danimai/core";
import type { ProductOption } from "../../../db/type";
import { ProductOptionResponseSchema } from "../retrieve-product-option/retrieve-product-option.schema";

const productOptionsFiltersSchema =
  createFilterableColumnsSchema<keyof Pick<ProductOption, "title">>({
    title: true,
  });

export const PaginatedProductOptionsSchema = createPaginationSchema(
  productOptionsFiltersSchema,
  ["id", "title", "created_at", "updated_at", "deleted_at"],
);

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, unknown>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object; Intersect is not supported by Elysia query validation). */
export const PaginatedProductOptionsQuerySchema = Type.Object({
  ...paginationQueryProperties,
  filters: Type.Optional(productOptionsFiltersSchema),
});

export type PaginatedProductOptionsProcessInput = Static<
  typeof PaginatedProductOptionsSchema
>;

export const PaginatedProductOptionsResponseSchema =
  createPaginatedResponseSchema(ProductOptionResponseSchema);
export type PaginatedProductOptionsProcessOutput = Static<
  typeof PaginatedProductOptionsResponseSchema
>;
